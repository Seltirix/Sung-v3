/**
 * Merci à ations#7873 pour l'idée et pour son aide !
 */

const Game = require('../../models/games/Game');
const UltimateMorpion = require('../../models/games/UltimateMorpion');

module.exports.run = async (client, message, args) => {
    const user = message.mentions.users.first() || client.users.cache.get(args[0]) || client.users.cache.find(u => u.username.toLowerCase().includes(args[0].toLowerCase()));

    if(!user || !message.guild.member(user)) return message.channel.send('⚠️ Cet utilisateur n\'existe pas !');
    if(user.id === message.author.id) return message.channel.send('⚠️ Vous ne pouvez pas vous battre contre vous-même');
    if(user.bot) return message.channel.send('⚠️ Vous ne pouvez pas vous battre contre un bot.');

    const msg = await message.channel.send(`${user}, **${message.author.tag}** veut jouer au Ultimate Morpion avec vous. \nRépondez par oui ou non pour accepter ou refuser.`)

    const emojis = [
        '1️⃣',
        '2️⃣',
        '3️⃣',
        '4️⃣',
        '5️⃣',
        '6️⃣',
        '7️⃣',
        '8️⃣',
        '9️⃣',
        '🔟',
        ...Object.values(require('../../emojis').numbers)
    ];

    const coll = message.channel.createMessageCollector((m) => m.author.id === user.id, { time: 60000 });
    coll.on('collect', async (collected) => {
        if(['oui', 'ui', 'yes', 'ye', 'y', 'ouai', 'ouais'].includes(collected.content?.toLowerCase())) {
            msg.delete().catch(() => {});
            collected.delete().catch(() => {});

            coll.stop();

            if(Game.findGameByUser(client, message.author) || Game.findGameByUser(client, user)) {
                return message.channel.send('⚠️ Vous ou votre adversaire jouez déjà à une partie !');
            }

            const gameMsg = await message.channel.send(printBoard());
            const embed = {
                color: client.config.embed.color,
                description: `La partie a commencée. C'est au tour de ${message.author}\n**❌ : ${message.author.tag}\n⭕ : ${user.tag}**`
            };
            const embedMsg = await message.channel.send({ embed });

            client.games.push(new UltimateMorpion(message.author, user));

            const collector = message.channel.createMessageCollector((m) => m.author.id === message.author.id || m.author.id === user.id);
            const timeouts = [];

            timeouts.push(client.setTimeout(() => {
                message.channel.send(`${message.author}, c'est à vous de jouer, vous avez encore 30s avant que la partie se termine !`).then((m) => {
                    setTimeout(() => m.delete().catch(() => {}), 15000);
                });

                timeouts.push(client.setTimeout(() => {
                    message.channel.send(`**${message.author.tag}** a déclaré forfait, ${user} remporte la victoire ! 🎉`);

                    UltimateMorpion.findGameByUsers(client, message.author, user).delete(client);
                    timeouts.forEach((timeout) => client.clearTimeout(timeout));
                }, 30000));
            }, 60000));

            collector.on('collect', async (played) => {
                const game = UltimateMorpion.findGameByUsers(client, message.author, user);
                if(!game) {
                    timeouts.forEach((timeout) => client.clearTimeout(timeout));
                    return collector.stop(true);
                }

                const currentPlayer = game.players[game.currentPlayer - 1];
                played.content = Number(played.content);
                played.delete().catch(() => {});
                const squarePlayed = Math.floor((played.content - 1) / 9);

                if(currentPlayer.id !== played.author.id) {
                    return played.reply('ce n\'est pas à votre tour de jouer !').then((m) => {
                        setTimeout(() => m.delete().catch(() => {}), 3000);
                    });
                }

                if(!Number.isInteger(played.content) || played.content < 1 || played.content > 81) {
                    return message.channel.send('⚠️ Merci de jouer sur une case entre 1 et 81 !').then((m) => {
                        setTimeout(() => m.delete().catch(() => {}), 3000);
                    });
                }

                const res = game.checkSquare(game.board[squarePlayed]);
                if(res) {
                    return message.channel.send('⚠️ Cette case est déjà remplie ou un joueur a déjà aligné dessus. Vous pouvez jouer ou vous voulez.').then((m) => {
                        setTimeout(() => m.delete().catch(() => {}), 3000);
                    });
                }

                if(!res && game.lastMove) {
                    if(!game.checkSquare(game.board[game.lastMove - 1])) {
                        if(game.lastMove !== squarePlayed + 1) {
                            return message.channel.send(`⚠️ Vous devez absolument jouer dans le carré n°${game.lastMove}!`).then((m) => {
                                setTimeout(() => m.delete().catch(() => {}), 3000);
                            });
                        }
                    }
                }

                if(!gameMsg.content.includes(emojis[played.content - 1])) {
                    return played.reply('⚠️ Cette case est déjà occupée !').then((m) => {
                        setTimeout(() => m.delete().catch(() => {}), 3000);
                    });
                }

                removeTimeouts(timeouts);

                (async () => {
                    timeouts.push(client.setTimeout(() => {
                        message.channel.send(`${game.currentPlayer === 1 ? game.challenger : game.opponent}, c'est à vous de jouer, vous avez encore 30s avant que la partie se termine !`).then((m) => {
                            setTimeout(() => m.delete().catch(() => {}), 15000);
                        });

                        timeouts.push(client.setTimeout(() => {
                            message.channel.send(`**${game.currentPlayer === 1 ? game.challenger.tag : game.opponent.tag}** a déclaré forfait, ${game.currentPlayer === 1 ? game.opponent : game.challenger} remporte la victoire ! 🎉`);
                            game.delete(client);
                            timeouts.forEach(timeout => client.clearTimeout(timeout));
                        }, 30000));
                    }, 60000));

                    await gameMsg.edit(gameMsg.content.replace(emojis[played.content - 1], game.getPlayerSymbol(game.currentPlayer)));

                    game.board[squarePlayed][(played.content % 9 === 0 ? 9 : played.content % 9) - 1] = game.getPlayerSymbol(game.currentPlayer);
                    game.lastMove = played.content % 9 === 0 ? 9 : played.content % 9;

                    game.changeCurrentPlayer();

                    const result = game.checkWin(game.board);
                    if(result) {
                        removeTimeouts(timeouts);
                        collector.stop(true);
                        game.delete(client);
                        embedMsg.delete().catch(() => {});

                        if(result === 'égalité') {
                            return message.channel.send('Partie terminée ! C\'est une égalité !');
                        } else if(result === '❌') {
                            return message.channel.send(`Partie terminée ! ${game.challenger} a gagné la partie ! 🎉`);
                        } else if(result === '⭕') {
                            return message.channel.send(`Partie terminée ! ${game.opponent} a gagné la partie ! 🎉`);
                        }
                    }

                    embed.description = embed.description.replace(currentPlayer.toString(), currentPlayer.id === game.opponent.id ? game.challenger.toString() : game.opponent.toString());
                    await embedMsg.edit({ embed });
                })();
            });
        } else if(['non', 'no', 'n'].includes(collected.content?.toLowerCase())) {
            coll.stop();
            return message.channel.send(`${user.tag} a refusé la partie :/`);
        }
    });

    coll.on('end', (_, reason) => {
        if(reason === 'time') return message.channel.send('Temps écoulé.');
    });

    const removeTimeouts = (timeouts) => {
        timeouts.forEach((timeout) => {
            timeouts = [];
            client.clearTimeout(timeout);
        });
    }

    const printBoard = () => {
        const res = [[[], [], []], [[], [], []], [[], [], []]],
        base = emojis.join('').match(/(?:<.+?>|\d\ufe0f\u20e3|🔟){9}/g);
        for (let i = 0; i < 9; i++) {
            const toPush = base[i].match(/(?:<.+?>|\d\ufe0f\u20e3|🔟){3}/g);
            for (let j = 0; j < 3; j++) res[Math.floor(i / 3)][j % 3].push(toPush[j]);
        }
        return res.map((e) => e.map((f) => f.join("\t")).join("\n")).join("\n\n");
    }
}

module.exports.help = {
    name: "ultimatemorpion",
    aliases: ["ultimatemorpion", "ultimate-morpion", "ultimate-tic-tac-toe", "ultimatetic-tac-toe", "ultimatetictactoe", "ultimate-ttt", "ultimatettt"],
    category: "Fun",
    description: "Jouer au ultimate morpion !\nMerci à ations#7873 :)",
    usage: "<membre>",
    cooldown: 30,
    memberPerms: [],
    botPerms: ["MANAGE_MESSAGES", "EMBED_LINKS"],
    args: true
}
