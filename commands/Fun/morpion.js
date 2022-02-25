const Morpion = require('../../models/games/Morpion');
const Game = require('../../models/games/Game');
const { MessageCollector } = require('discord.js');

module.exports.run = async (client, message, args) => {
    const user = message.mentions.users.first() || client.users.cache.get(args[0]) || client.users.cache.find(u => u.username.toLowerCase().includes(args[0].toLowerCase()));

    if(!user || !message.guild.member(user)) return message.channel.send('⚠️ Cet utilisateur n\'existe pas !');
    if(user.id === message.author.id) return message.channel.send('⚠️ Vous ne pouvez pas vous battre contre vous-même');
    if(user.bot) return message.channel.send('⚠️ Vous ne pouvez pas vous battre contre un bot.');

    let m = await message.channel.send(`${user}, **${message.author.tag}** veut jouer au morpion avec vous. \nRépondez par oui ou non pour accepter ou refuser.`)

    let embed;
    let gMsg;
    const emojis = [
        { "1": "1️⃣" },
        { "2": "2️⃣" },
        { "3": "3️⃣" },
        { "4": "4️⃣" },
        { "5": "5️⃣" },
        { "6": "6️⃣" },
        { "7": "7️⃣" },
        { "8": "8️⃣" },
        { "9": "9️⃣" }
    ];

    const filter = m => m.author.id === user.id;
    const col = new MessageCollector(message.channel, filter, { time: 60000 });
    col.on("collect", async (tmsg) => {
        if(['oui', 'ui', 'yes', 'ye', 'y', 'ouai', 'ouais'].includes(tmsg.content?.toLowerCase())) {
            col.stop();

            const existingGame = Game.findGameByUser(client, message.author) || Game.findGameByUser(client, user);
            if(existingGame) {

                m.delete().catch(() => {});
                tmsg.delete().catch(() => {});

                return message.channel.send('⚠️ Vous ou votre adversaire jouez déjà à une partie !');
            }

            m.delete().catch(() => {});
            tmsg.delete().catch(() => {});

            gMsg = await message.channel.send('1️⃣2️⃣3️⃣\n4️⃣5️⃣6️⃣\n7️⃣8️⃣9️⃣');

            embed = await message.channel.send({
                embed: {
                    color: client.config.embed.color,
                    description: `La partie a commencée. C'est au tour de ${message.author}`
                }
            });

            client.games.push(new Morpion(message.author, user));

            const filter1 = m => m.author.id === message.author.id || m.author.id === user.id;
            const collector = new MessageCollector(message.channel, filter1);

            let timeouts = [];
            
            timeouts.push(client.setTimeout(() => {
                message.channel.send(`${message.author}, c'est à vous de jouer, vous avez encore 30s avant que la partie se termine !`).then(m => m.delete({ timeout: 15000 }));

                timeouts.push(client.setTimeout(() => {
                    message.channel.send(`**${message.author.tag}** a déclaré forfait, ${user} remporte la victoire ! 🎉`);
                    Morpion.findGameByUsers(client, message.author, user).delete(client);
                    timeouts.forEach(timeout => client.clearTimeout(timeout));
                }, 30000));
            }, 20000));

            collector.on("collect", async (toPlay) => {
                let game = Morpion.findGameByUsers(client, message.author, user);

                if(!game) {
                    collector.stop(true);
                    timeouts.forEach(timeout => client.clearTimeout(timeout));
                    return;
                }

                let currentPlayer = game.currentPlayer;

                if(game.players[currentPlayer - 1].id !== toPlay.author.id) {
                    toPlay.delete().catch(() => {});
                    return toPlay.reply("ce n'est pas à votre tour de jouer !").then(m => m.delete({ timeout: 3000 }).catch(() => {}));
                }

                if(isNaN(parseInt(toPlay.content)) || parseInt(toPlay.content) < 1 || parseInt(toPlay.content) > 9) {
                    toPlay.delete().catch(() => {});
                    return message.channel.send('⚠️ Merci de jouer sur une case entre 1 et 9 !').then(m => m.delete({ timeout: 3000 }).catch(() => {}));
                }

                if(!gMsg.content.includes(emojis[parseInt(toPlay.content) - 1][toPlay.content])) {
                    message.channel.send('⚠️ Cette case est déjà occupée !').then(m => m.delete({ timeout: 3000 }));
                    return toPlay.delete();
                }
                
                removeTimeouts();

                async function change() {
                    timeouts.push(client.setTimeout(() => {
                        message.channel.send(`${currentPlayer === 1 ? game.opponent : game.challenger}, c'est à vous de jouer, vous avez encore 30s avant que la partie se termine !`).then(m => m.delete({ timeout: 15000 }));

                        timeouts.push(client.setTimeout(() => {
                            message.channel.send(`**${currentPlayer === 1 ? game.opponent.tag : game.challenger.tag}** a déclaré forfait, ${currentPlayer === 1 ? game.challenger : game.opponent} remporte la victoire ! 🎉`);
                            game.delete(client);
                            timeouts.forEach(timeout => client.clearTimeout(timeout));
                        }, 30000));
                    }, 20000));

                    await gMsg.edit(gMsg.content.replace(emojis[parseInt(toPlay.content) - 1][toPlay.content], Morpion.getPlayerSymbol(currentPlayer)));

                    const result = game.checkWin(game.board);
                    if(result) {
                        timeouts.forEach(timeout => client.clearTimeout(timeout));
                        collector.stop(true);
                        toPlay.delete();

                        if(result === "égalité") {
                            game.delete(client);
                            embed.delete().catch(console.error);
                            return message.channel.send("Partie terminée ! C'est une égalité !");
                        }
                        else if(result === "❌") {
                            game.delete(client);
                            embed.delete().catch(console.error);
                            return message.channel.send(`Partie terminée ! ${game.challenger} a gagné la partie ! 🎉`);
                        }
                        else if(result === "⭕") {
                            game.delete(client);
                            embed.delete().catch(console.error);
                            return message.channel.send(`Partie terminée ! ${game.opponent} a gagné la partie ! 🎉`);
                        }
                    }

                    game.changeCurrentPlayer();
                    toPlay.delete().catch(() => {});
            
                    await embed.edit(embed.embeds[0].setDescription(`La partie a commencée. C'est au tour de ${currentPlayer === 1 ? game.opponent : game.challenger}`));
                }

                function removeTimeouts() {
                    timeouts.forEach(timeout => {
                        timeouts = [];
                        client.clearTimeout(timeout);
                    });
                }

                switch (toPlay.content) {
                    case "1": {
                        if(currentPlayer === 1) {
                            change();
                            game.board[0][0] = Morpion.getPlayerSymbol(currentPlayer);
                            break;
                        } else {
                            change();
                            game.board[0][0] = Morpion.getPlayerSymbol(currentPlayer);
                            break;
                        }
                    }
                    case "2": {
                        if(currentPlayer === 1) {
                            change();
                            game.board[0][1] = Morpion.getPlayerSymbol(currentPlayer);
                            break;
                        } else {
                            change();
                            game.board[0][1] = Morpion.getPlayerSymbol(currentPlayer);
                            break;
                        }
                    }
                    case "3": {
                        if(currentPlayer === 1) {
                            change();
                            game.board[0][2] = Morpion.getPlayerSymbol(currentPlayer);
                            break;
                        } else {
                            change();
                            game.board[0][2] = Morpion.getPlayerSymbol(currentPlayer);;
                            break;
                        }
                    }
                    case "4": {
                        if(currentPlayer === 1) {
                            change();
                            game.board[1][0] = Morpion.getPlayerSymbol(currentPlayer);
                            break;
                        } else {
                            change();
                            game.board[1][0] = Morpion.getPlayerSymbol(currentPlayer);
                            break;
                        }
                    }
                    case "5": {
                        if(currentPlayer === 1) {
                            change();
                            game.board[1][1] = Morpion.getPlayerSymbol(currentPlayer);
                            break;
                        } else {
                            change();
                            game.board[1][1] = Morpion.getPlayerSymbol(currentPlayer);
                            break;
                        }
                    }
                    case "6": {
                        if(currentPlayer === 1) {
                            change();
                            game.board[1][2] = Morpion.getPlayerSymbol(currentPlayer);
                            break;
                        } else {
                            change();
                            game.board[1][2] = Morpion.getPlayerSymbol(currentPlayer);
                            break;
                        }
                    }
                    case "7": {
                        if(currentPlayer === 1) {
                            change();
                            game.board[2][0] = Morpion.getPlayerSymbol(currentPlayer);
                            break;
                        } else {
                            change();
                            game.board[2][0] = Morpion.getPlayerSymbol(currentPlayer);
                            break;
                        }
                    }
                    case "8": {
                        if(currentPlayer === 1) {
                            change();
                            game.board[2][1] = Morpion.getPlayerSymbol(currentPlayer);
                            break;
                        } else {
                            change();
                            game.board[2][1] = Morpion.getPlayerSymbol(currentPlayer);
                            break;
                        }
                    }
                    case "9": {
                        if(currentPlayer === 1) {
                            change();
                            game.board[2][2] = Morpion.getPlayerSymbol(currentPlayer);
                            break;
                        } else {
                            change();
                            game.board[2][2] = Morpion.getPlayerSymbol(currentPlayer);
                        }
                    }
                }
            });
        } else if(['non', 'no', 'n'].includes(tmsg.content?.toLowerCase())) {
            col.stop();
            return message.channel.send(`${user.tag} a refusé la partie :/`);
        }
    });

    col.on("end", (_, reason) => {
        if(reason === 'time') return message.channel.send('Temps écoulé');
    });
}

module.exports.help = {
    name: "morpion",
    aliases: ["morpion", "tic-tac-toe", "tictactoe", "ttt"],
    category: "Fun",
    description: "Jouer au morpion !",
    usage: "<membre>",
    cooldown: 30,
    memberPerms: [],
    botPerms: ["MANAGE_MESSAGES"],
    args: true
}
