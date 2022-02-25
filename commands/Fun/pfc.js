module.exports.run = async (client, message, args) => {
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.guild.members.cache.find((u) => u.user.username.toLowerCase().includes(args[0]?.toLowerCase()));
    const attacks = {
        pierre: '🪨',
        feuille: '📃',
        ciseaux: '✂️'
    };

    if(!member) {
        let authorAttack = args[0].toLowerCase();
        if(Object.keys(attacks).includes(authorAttack)) {
            let attack = Object.keys(attacks)[Math.floor(Math.random() * Object.keys(attacks).length)];
            const embed = {
                color: client.config.embed.color,
                author: { name: message.author.tag, icon_url: message.author.displayAvatarURL({ dynamic: true }) },
                description: `**${message.author.username}**, vous avez choisi **${authorAttack}**. J'ai choisi **${attack}**.`,
                footer: { text: client.config.embed.footer, icon_url: client.user.displayAvatarURL() }
            };

            authorAttack = authorAttack.charAt(0);
            attack = attack.charAt(0);

            switch (authorAttack + attack) {
                case 'pc':
                case 'fp':
                case 'cf':
                    embed.description += '\nVous avez gagné!';
                    break;
                case 'cp':
                case 'pf':
                case 'fc':
                    embed.description += '\nVous avez perdu :(';
                    break;
                case 'pp':
                case 'ff':
                case 'cc':
                    embed.description += '\nC\'est une égalité!';
                    break;
            }

            return message.channel.send({ embed });
        } else {
            return message.channel.send(`⚠️ Vous devez préciser l\'une des possibilités suivantes: ${Object.keys(attacks).map((a) => `\`${a}\``)}.`);
        }
    } else {
        if(member.user.bot) return message.channel.send('⚠️ Tu ne peux pas jouer avec un bot ! Et ce ne sera sûrement jamais possible...');
        if(member.id === message.author.id) return message.channel.send('⚠️ Non, tu ne peux pas jouer avec toi même, réfléchis un peu.');
        const embed = {
            color: client.config.embed.color,
            description: 'Cliquez sur la réaction ✅ lorsque vous êtes prêts !'
        };
        const msg = await message.channel.send(member, { embed });
        const rArr = ['✅', '❌'];
        rArr.forEach(async (r) => await msg.react(r));

        const rColl = msg.createReactionCollector((reaction, user) => [message.author.id, member.id].includes(user.id) && rArr.includes(reaction.emoji.name), { time: 60000 });

        rColl.on('collect', async (reaction, user) => {
            if(reaction.emoji.name === '✅') {
                if(msg.embeds[0].description === embed.description) {
                    msg.embeds[0].description += `\n✅ ${user} est prêt !`;
                    await msg.edit(msg.embeds[0]);
                } else if(!msg.embeds[0].description.includes(user.toString())) {
                    rColl.stop(true);
                    msg.delete().catch(() => {});

                    const collector = message.channel.createMessageCollector((m) => [message.author.id, member.id].includes(m.author.id), { time: 10000, max: 2 });
                    const results = [];
                    const msg1 = await message.channel.send(`**Préparez votre choix ${member} et ${message.author} !**\n**Rappel**: choix possibles : ${Object.keys(attacks).map((a) => `\`${a}\``)} !`);

                    collector.on('collect', (tmsg) => {
                        if(msg1.createdTimestamp + 6000 > tmsg.createdTimestamp) {
                            collector.stop(true);
                            msg1.delete().catch(() => {});

                            return message.channel.send(`Trop tôt ${tmsg.author} !! Attendez la fin du compteur avant de jouer le prochaine fois !`);
                        }

                        if(!Object.keys(attacks).includes(tmsg.content?.toLowerCase())) return message.channel.send(`⚠️ Vous devez préciser l\'une des possibilités suivantes: ${Object.keys(attacks).map((a) => `\`${a}\``)}.`);
                        tmsg.delete().catch(() => {});

                        if(results.find((r) => r.author.id === tmsg.author.id)) return message.channel.send(`⚠️ Vous ne pouvez jouer d'une seule fois ${message.author} !`);
                        results.push(tmsg);

                        if(results.length === 2) {
                            collector.stop(true);
                            msg1.delete().catch(() => {});

                            const embed = {
                                color: client.config.embed.color,
                                title: 'Résultat du pierre-feuille-ciseaux',
                                description: results.map((res) => `**${res.author.tag}** a joué \`${res.content.toLowerCase()}\` ${attacks[res.content.toLowerCase()]}`).join('\n'),
                                footer: { text: client.config.embed.footer, icon_url: client.user.displayAvatarURL() }
                            };

                            switch (results[0].content.toLowerCase().charAt(0) + results[1].content.toLowerCase().charAt(0)) {
                                case 'pc':
                                case 'fp':
                                case 'cf':
                                    embed.description += `\n\n**${results[0].author} remporte la victoire !**`;
                                    break;
                                case 'cp':
                                case 'pf':
                                case 'fc':
                                    embed.description += `\n\n**${results[1].author} remporte la victoire !**`
                                    break;
                                case 'pp':
                                case 'ff':
                                case 'cc':
                                    embed.description += '\n\n**C\'est une égalité !**';
                                    break;
                            }

                            message.channel.send({ embed });
                        }
                    });

                    collector.on('end', (_, reason) => {
                        if(reason === 'time') return message.channel.send('Vous avez mis trop de temps à envoyer votre choix !');
                    });

                    const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
                    const m = await message.channel.send('Envoyez votre choix dans 5 secondes !');
                    for (let i = 5; i > 0; i--) {
                        await sleep(1000);
                        if(i === 1) await m.edit('**Envoyez votre choix** !').then((_m) => setTimeout(() => m.delete().catch(() => {}), 2000));
                        else await m.edit(`Envoyez votre choix dans ${i - 1} secondes !`);
                    }
                }
            } else if(reaction.emoji.name === '❌') {
                rColl.stop(true);
                msg.delete().catch(() => {});

                return message.channel.send(user.id === member.id ? `${member} a refusé la partie :/` : `${message.author} a annulé la partie.`);
            }
        });

        rColl.on('end', (_, reason) => {
            if(reason === 'time') return message.channel.send('Temps écoulé');
        });
    }
}

module.exports.help = {
    name: "pfc",
    aliases: ["pfc", "pierrefeuilleciseaux", "pierre-feuille-ciseaux", "papiercaillouciseaux", "papier-caillou-ciseaux"],
    category: "Fun",
    description: "Jouer au pierre feuille ciseaux !",
    usage: "[membre] <pierre | feuille | ciseaux>",
    cooldown: 3,
    memberPerms: [],
    botPerms: ["EMBED_LINKS"],
    args: true
}
