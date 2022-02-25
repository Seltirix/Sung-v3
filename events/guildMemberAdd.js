const { createCanvas, registerFont } = require('canvas');

module.exports = async (client, member) => {
    const data = await client.getGuild(member.guild);
    if(!data) return;

    await client.findOrCreateUser(member.user);

    if(data.plugins.protection.raidmode === true) {
        member.kick('Raidmode activé').then(() => {
            member.send('**⚠️ Le Raidmode est activé sur le serveur ' + member.guild.name + ', vous avez donc été kick de celui-ci! ⚠️** \nSi vous pensez que c\'est une erreur, contactez le propriétaire du serveur.').catch(() => {});

            if(data.plugins.logs.channel) {
                member.guild.channels.cache.get(data.plugins.logs.channel).send(`**${member.user.tag}** a tenté de rejoindre le serveur, mais le Raidmode est activé. ${client.user.username} l'a donc expulsé du serveur.`);
            }
        }).catch(console.error);
    }

    if(data.plugins.protection.captcha?.enabled && !member.user.bot) {
        member.roles.add(data.plugins.protection.captcha.not_verified_role).catch(() => {});

        let chars = 'abcdefghijfklmopqrstuvwxyz0123456789';
        let final = '';

        if(data.plugins.protection.captcha.difficulty_level === 1) {
            chars = chars.split('').filter(isNaN);
            for (let i = 0; i < 5; i++) {
                final += chars[Math.floor(Math.random() * chars.length)];
            }
        } else if(data.plugins.protection.captcha.difficulty_level === 2) {
            chars = chars.split('');
            for (let i = 0; i < 5; i++) {
                final += chars[Math.floor(Math.random() * chars.length)];
            }
        } else if(data.plugins.protection.captcha.difficulty_level === 3) {
            chars = chars.split('');
            for (let i = 0; i < 5; i++) {
                const upperCase = (Math.floor(Math.random() * 2) + 1) === 1;
                if(upperCase) {
                    final += (chars[Math.floor(Math.random() * chars.length)]).toUpperCase();
                } else {
                    final += chars[Math.floor(Math.random() * chars.length)];
                }
            }
        }

        registerFont('./assets/RoboticRevolution.ttf', { family: 'RoboticRevolution' });

        const canvas = createCanvas(250, 100);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.font = '50px "RoboticRevolution"';
        ctx.textAlign = 'center';
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.fill();

        ctx.fillStyle = '#000000';
        for (const [i, char] of final.split('').entries()) {
            ctx.fillText(char, i * 40 + 40, canvas.height - 35);
        }

        const verif_channel = member.guild.channels.cache.get(data.plugins.protection.captcha.verif_channel);
        if(verif_channel) {
            const verifMsg = await verif_channel.send(`Bienvenue ${member}, veuillez remplir le captcha ci-dessous pour accéder au serveur.`, {
                files: [{ attachment: canvas.toBuffer(), name: 'captcha.png' }]
            });

            const collector = verif_channel.createMessageCollector((m) => m.author.id === member.id, { max: 3, time: 120000 });
            collector.on('collect', async (tmsg) => {
                setTimeout(() => tmsg.delete().catch(() => {}), 5000);

                if(tmsg.content !== final) {
                    return tmsg.channel.send(`⚠️ Code invalide ${member} ! Il vous reste ${collector.received === 1 ? '2' : '1'} essai.`)
                        .then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));
                } else {
                    collector.stop();
                    member.roles.remove(data.plugins.protection.captcha.not_verified_role).then(async () => {
                        if(data.plugins.autorole.enabled) {
                            if(data.plugins.autorole.role) {
                                await member.roles.add(data.plugins.autorole.role).catch(() => {});
                            }
                        }
                    }).catch(() => {});
                }
            });

            collector.on('end', async (_, reason) => {
                verifMsg.delete().catch(() => {});

                if(reason === 'limit') {
                    await member.send('Vous avez fait trop d\'essais ! Vous avez été expulsé du serveur.').catch(() => {});
                    member.kick('Captcha non réussi').catch(() => {});
                }

                if(reason === 'time') {
                    await member.send('Vous avez mis trop de temps à faire le captcha, vous avez été expulsé du serveur.').catch(() => {});
                    member.kick('Captcha non complété').catch(() => {});
                }
            });
        }
    } else if(data.plugins.autorole.enabled) {
        if(data.plugins.autorole.role && !member.user.bot) {
            await member.roles.add(data.plugins.autorole.role).catch(() => {});
        } else if(data.plugins.autorole.botRole && member.user.bot) {
            await member.roles.add(data.plugins.autorole.botRole).catch(() => {});
        }
    }

    if(!data.plugins.welcome.enabled) return;

    let welcomeMsg = data.plugins.welcome.message
        ?.replace('{user}', member)
        .replace('{guildName}', member.guild.name)
        .replace('{memberCount}', member.guild.memberCount)
        .replace('{username}', member.user.username)
        .replace('{usertag}', member.user.tag);

    if(!data.plugins.welcome.channel) {
        await member.send(welcomeMsg).catch(() => {});
    } else {
        if(member.guild.channels.cache.get(data.plugins.welcome.channel)) {
            welcomeMsg && data.plugins.welcome.image
            ? member.guild.channels.cache.get(data.plugins.welcome.channel).send(welcomeMsg, {
                    files: [{
                        attachment: await client.generateWelcomeCard(member)
                    }]
                })
            : welcomeMsg && !data.plugins.welcome.image
            ? member.guild.channels.cache.get(data.plugins.welcome.channel).send(welcomeMsg)
            : !welcomeMsg && data.plugins.welcome.image
            ? member.guild.channels.cache.get(data.plugins.welcome.channel).send({
                    files: [{
                        attachment: await client.generateWelcomeCard(member)
                    }]
                })
            : undefined
        }
    }
}
