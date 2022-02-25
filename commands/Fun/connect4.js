const ConnectFour = require('../../models/games/ConnectFour');
const Game = require('../../models/games/Game');
const { MessageCollector } = require('discord.js');
const emojis = require('../../emojis');

module.exports.run = async (client, message, args) => {
    const user = message.mentions.users.first() || client.users.cache.get(args[0]) || client.users.cache.find(u => u.username.toLowerCase().includes(args[0].toLowerCase()));

    if(!user || !message.guild.member(user)) return message.channel.send('⚠️ Cet utilisateur n\'existe pas !');
    if(user.id === message.author.id) return message.channel.send('⚠️ Vous ne pouvez pas vous battre contre vous-même');
    if(user.bot) return message.channel.send('⚠️ Vous ne pouvez pas vous battre contre un bot.');

    let m = await message.channel.send(`${user}, **${message.author.tag}** veut jouer au puissance 4 avec vous. \nRépondez par oui ou non pour accepter ou refuser.`)

    let embed;
    let gMsg;
    let reactions = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣"];

    const filter = m => m.author.id === user.id;
    const col = new MessageCollector(message.channel, filter, { time: 60000 });
    col.on("collect", async (tmsg) => {
        if(['oui', 'ui', 'yes', 'ye', 'y', 'ouai', 'ouais'].includes(tmsg.content?.toLowerCase())) {
            const existingGame = Game.findGameByUser(client, message.author) || Game.findGameByUser(client, user);
            if(existingGame) {
                col.stop(true);

                m.delete().catch(() => {});
                tmsg.delete().catch(() => {});

                return message.channel.send('⚠️ Vous ou votre adversaire jouez déjà à une partie !');
            }

            col.stop(true);

            m.delete().catch(() => {});
            tmsg.delete().catch(() => {});

            gMsg = await message.channel.send(`${reactions.join("")}\n\n${(emojis.black_circle.repeat(7) + "\n").repeat(6)}`);

            embed = await message.channel.send({
                embed: {
                    color: client.config.embed.color,
                    description: `La partie a commencée. C'est au tour de ${message.author}`
                }
            });

            reactions.forEach(async(reaction) => {
                await gMsg.react(reaction);
            })

            client.games.push(new ConnectFour(message.author, user));

            const filter1 = (reaction, member) => member.id === message.author.id || member.id === user.id;
            const collector = gMsg.createReactionCollector(filter1);

            let timeouts = [];
            
            timeouts.push(client.setTimeout(() => {
                message.channel.send(`${message.author}, c'est à vous de jouer, vous avez encore 30s avant que la partie se termine !`).then(m => m.delete({ timeout: 15000 }));

                timeouts.push(client.setTimeout(() => {
                    message.channel.send(`**${message.author.tag}** a déclaré forfait, ${user} remporte la victoire ! 🎉`);
                    Game.findGameByUsers(client, message.author, user).delete(client);
                    timeouts.forEach(timeout => client.clearTimeout(timeout));
                }, 30000));
            }, 50000));

            collector.on("collect", async (reaction, user1) => {
                let game = ConnectFour.findGameByUsers(client, message.author, user)

                if(!game) {
                    collector.stop(true);
                    timeouts.forEach(timeout => client.clearTimeout(timeout));
                    embed.delete().catch(() => {});
                    return;
                }

                let currentPlayer = game.currentPlayer;

                if(game.players[currentPlayer - 1].id !== user1.id) return;

                if(isNaN(translate(reaction.emoji.name))) return;

                if(game.board[0][translate(reaction.emoji.name) - 1] !== emojis.black_circle) return message.channel.send('⚠️ Cette colonne est pleine !').then(m => m.delete({ timeout: 3000 }));

                removeTimeouts();

                switch(reaction.emoji.name) {
                    case "1️⃣": change(); break;
                    case "2️⃣": change(); break;
                    case "3️⃣": change(); break;
                    case "4️⃣": change(); break;
                    case "5️⃣": change(); break;
                    case "6️⃣": change(); break;
                    case "7️⃣": change(); break;
                }

                async function change() {
                    timeouts.push(client.setTimeout(() => {
                        message.channel.send(`${currentPlayer === 1 ? game.opponent : game.challenger}, c'est à vous de jouer, vous avez encore 30s avant que la partie se termine !`).then(m => m.delete({ timeout: 15000 }));

                        timeouts.push(client.setTimeout(() => {
                            message.channel.send(`**${currentPlayer === 1 ? game.opponent.tag : game.challenger.tag}** a déclaré forfait, ${currentPlayer === 1 ? game.challenger : game.opponent} remporte la victoire ! 🎉`);
                            game.delete(client);
                            timeouts.forEach(timeout => client.clearTimeout(timeout));
                        }, 30000));
                    }, 50000));

                    for (let i = game.board.length; i > 0; i--) {
                        if(game.board[i - 1][translate(reaction.emoji.name) - 1] === emojis.black_circle) {
                            game.board[i - 1][translate(reaction.emoji.name) - 1] = ConnectFour.getPlayerSymbol(game.currentPlayer);
                            break;
                        }
                    }

                    if(game.board[0][translate(reaction.emoji.name) - 1] !== emojis.black_circle) {
                        reaction.remove();
                    } else {
                        reaction.users.remove(user1);
                    }

                    embed.edit(embed.embeds[0].setDescription(`La partie a commencée. C'est au tour de ${currentPlayer === 1 ? game.opponent : game.challenger}`))

                    game.changeCurrentPlayer();
                    await gMsg.edit(displayNewBoard());

                    const result = game.checkWin(ConnectFour.getPlayerSymbol(game.currentPlayer === 1 ? 2 : 1));

                    if(game.board[0].every(c => c !== emojis.black_circle) && !result) {
                        removeTimeouts();
                        collector.stop(true);
                        await reaction.message.reactions.removeAll();

                        embed.delete();
                        game.delete(client);

                        return message.channel.send(`Partie terminée ! C'est une égalité...`);
                    }

                    if(result) {
                        removeTimeouts();
                        collector.stop(true);
                        await reaction.message.reactions.removeAll();

                        embed.delete();
                        game.delete(client);

                        return message.channel.send(`Partie terminée ! ${user1} a gagné la partie ! 🎉`);
                    }
                }

                function removeTimeouts() {
                    timeouts.forEach(timeout => {
                        timeouts = [];
                        client.clearTimeout(timeout);
                    });
                }

                function translate(reaction) {
                    switch (reaction) {
                        case '1️⃣': reaction = "1"; break;
                        case '2️⃣': reaction = "2"; break;
                        case '3️⃣': reaction = "3"; break;
                        case '4️⃣': reaction = "4"; break;
                        case '5️⃣': reaction = "5"; break;
                        case '6️⃣': reaction = "6"; break;
                        case '7️⃣': reaction = "7"; break;
                    }

                    return reaction;
                }

                function displayNewBoard() {
                    return `${reactions.join("")}\n\n${displayBoard()}`;

                    function displayBoard() {
                        let message = "";

                        for (let i = 0; i < game.board.length; i++) {
                            for(let j = 0; j < game.board[i].length; j++) {
                                message += game.board[i][j];
                            }

                            message += "\n";
                        }

                        return message;
                    }
                }
            });
        } else if(['non', 'no', 'n'].includes(tmsg.content?.toLowerCase()))  {
            col.stop(true);
            return message.channel.send(`${user.tag} a refusé la partie :/`);
        }
    });

    col.on("end", (_, reason) => {
        if(reason === 'time') return message.channel.send('Temps écoulé');
    });
}

module.exports.help = {
    name: "connect4",
    aliases: ["connect4", "puissance4"],
    category: "Fun",
    description: "Jouer au puissance 4 !",
    usage: "<membre>",
    cooldown: 30,
    memberPerms: [],
    botPerms: ["MANAGE_MESSAGES"],
    args: true
}
