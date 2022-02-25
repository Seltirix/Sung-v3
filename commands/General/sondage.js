module.exports.run = async (client, message, args) => {
    const question = args.join(' ');
    if(!question || question.length > 500) return message.channel.send('⚠️ Votre question ne doit pas dépasser 500 caractères!');

    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const options = [];

    await askForNewOption();

    function askForNewOption() {
        return new Promise(async (resolve) => {
            if(options.length === 0) {
                const m = await message.channel.send('**Quelle option de réponse voulez vous ajouter à votre sondage ?**');

                return askQuestion().then(() => {
                    m.delete().catch(() => {});
                    askForNewOption();
                });
            }

            if(options.length === 10) return end();

            const msg = await message.channel.send('**Voulez-vous ajouter une nouvelle possibilité de réponse à votre sondage ?**');
            const reactions = ['✅', '❌'];
            reactions.forEach((r) => msg.react(r));

            msg.awaitReactions((reaction, user) => reactions.includes(reaction.emoji.name) && user.id === message.author.id, { time: 30000, max: 1 })
                .then(async (collReact) => {
                    msg.delete().catch(() => {});

                    if(collReact.first()?.emoji?.name === '✅') {
                        const m = await message.channel.send('**Quelle option de réponse voulez vous ajouter à votre sondage ?**');

                        askQuestion().then(() => {
                            m.delete().catch(() => {});
                            askForNewOption();
                        });
                    } else if(collReact.first()?.emoji?.name === '❌') {
                        end();
                    }
                })
                .catch(() => message.channel.send('❌ Vous avez mis trop de temps à répondre, commande annulée.'));

            function askQuestion() {
                return new Promise((res) => {
                    const collector = message.channel.createMessageCollector((m) => m.author.id === message.author.id, { time: 360000, max: 5 });
                    collector.on('collect', (tmsg) => {
                        const option = tmsg.content;
                        if(!option) return message.channel.send('⚠️ Merci de spécifier une option valide!');
                        if(option.length > 150) return message.channel.send('⚠️ Votre option ne doit pas faire plus de 150 caractères.')

                        collector.stop();
                        tmsg.delete().catch(() => {});

                        res(options.push(option));
                    });

                    collector.on('end', (_, reason) => {
                        if(reason === 'time') return message.channel.send('❌ Vous avez mis trop de temps à répondre, commande annulée.');
                        if(reason === 'limit') return message.channel.send('❌ Vous avez fait trop d\'essais ! Veuillez réessayer.');
                    });
                });
            }

            function end() {
                if(options.length < 2) return message.channel.send('❌ Vous devez avoir minimum 2 options de réponses.');

                return message.channel.send({
                    embed: {
                        color: client.config.embed.color,
                        title: '📊 Sondage',
                        description: `**__${require('discord.js').Util.escapeMarkdown(question)}__**\n\n${options.map((q, i) => `${emojis[i]} ➔ **${q}**`).join('\n')}`,
                        footer: { text: `Sondage de ${message.author.tag}`, icon_url: message.author.displayAvatarURL({ dynamic: true }) }
                    }
                }).then((m) => {
                    emojis.slice(0, options.length).forEach((emoji) => m.react(emoji));
                });
            }
        });
    }
}

module.exports.help = {
    name: "sondage",
    aliases: ["sondage", "sondages", "poll"],
    category: "General",
    description: "Créer un sondage. Vous pouvez ajouter jusqu'à 10 possiblités de réponses.",
    usage: "<question>",
    cooldown: 3,
    memberPerms: [],
    botPerms: ["EMBED_LINKS", "ADD_REACTIONS", "MANAGE_MESSAGES"],
    args: true
}
