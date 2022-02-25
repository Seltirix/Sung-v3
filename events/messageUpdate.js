const Discord = require('discord.js');
const Guild = require('../models/Guild');

module.exports = async (client, oldMessage, newMessage) => {
    if(!newMessage.author) return;
    if(newMessage.channel.type === "dm" || newMessage.author.bot) return;
    if(oldMessage.content == newMessage.content) return;

    if(newMessage.content.includes(client.token)) {
        return newMessage.delete().then(() => client.users.cache.get(client.config.owner.id).send("Tu devrais regen ton token. C'est juste un conseil."));
    }

    const dbUser = await client.findOrCreateUser(newMessage.author);
    const data = await client.getGuild(newMessage.guild);

    const p = data.members.map(m => m.id).indexOf(newMessage.member.id);
    const userData = data.members[p];

    if(newMessage.guild && p == -1) {
        await Guild.updateOne({
            id: newMessage.guild.id
        },
        { 
            $push: {
                members: {
                    id: newMessage.member.id,
                    exp: 0,
                    level: 0
                }
            }
        });
    }

    if(data.plugins.protection.antimaj) {
        if(!data.plugins.protection.ignored_channels?.includes(newMessage.channel.id)) {
            if(!newMessage.member.roles.cache.array().some((role, i) => role.id === (data.plugins.protection.ignored_roles ? data.plugins.protection.ignored_roles[i] : null))) {
                if(!newMessage.member.hasPermission('MANAGE_MESSAGES')) {
                    let text = newMessage.content.split('');
                    let upperCaseLetters = 0;
                    const validchars = 'abcdefghigklmnopqerstuvwxyz';

                    for (let i = 0; i < text.length; i++) {
                        if (text[i] === text[i].toUpperCase() && (validchars.includes(text[i].toLowerCase()) || validchars.toUpperCase().includes(text[i].toUpperCase()))) {
                            upperCaseLetters++
                        }
                    }
                
                    if(text.length > 5) {
                        if(upperCaseLetters * (1000 / text.length) >= 500) {
                            newMessage.delete().catch(() => {});

                            dbUser.warns.push({ guildID: newMessage.guild.id, reason: 'Excessive caps', moderator: client.user.id });

                            dbUser.markModified("warns");
                            dbUser.save();

                            newMessage.author.send(`Vous avez été averti sur ${newMessage.guild.name} pour **Excessive caps**.`).catch(() => {});

                            if(data.plugins.logs.enabled) {
                                if(newMessage.guild.channels.cache.get(data.plugins.logs.channel)) {
                                    const embed = new Discord.MessageEmbed()
                                        .setColor('ORANGE')
                                        .setDescription(`L'utilisateur **${newMessage.author.username}** s'est fait avertir pour **Excessive caps**. Il possède désormais ${dbUser.warns.length} warn(s).`)
                                        .setFooter(client.config.embed.footer, client.user.displayAvatarURL());
                                    newMessage.guild.channels.cache.get(data.plugins.logs.channel).send(embed);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    const prefixes = [`<@!${client.user.id}> `, `<@${client.user.id}> `, data.prefix]
    let prefix = null;
    prefixes.forEach(p => {
        if(newMessage.content.startsWith(p)) {
            prefix = p;
        }
    });

    if(data.plugins.protection.antilink) {
        if(!data.plugins.protection.ignored_channels?.includes(newMessage.channel.id)) {
            if(!newMessage.member.roles.cache.array().some((role, i) => role.id === (data.plugins.protection.ignored_roles ? data.plugins.protection.ignored_roles[i] : null))) {
                if(/discord(?:(?:app)?\.com\/invite|\.gg(?:\/invite)?)\/([\w-]{2,255})/i.test(newMessage.content)) {
                    if(!newMessage.guild.member(newMessage.author).hasPermission("MANAGE_MESSAGES")) {
                        return newMessage.delete().then(() => {
                            if(data.plugins.logs.enabled && data.plugins.logs.channel) {
                                let embed = {
                                    color: 'RED',
                                    author: {
                                        name: newMessage.author.username,
                                        icon_url: newMessage.author.displayAvatarURL({ dynamic: true })
                                    },
                                    description: `${newMessage.author} a envoyé une pub dans ${newMessage.channel}!`,
                                    fields: [
                                        {
                                            name: "Message d'origine",
                                            value: newMessage.content
                                        }
                                    ],
                                    footer: {
                                        text: client.config.embed.footer,
                                        icon_url: client.user.displayAvatarURL()
                                    }
                                }

                                if(embed.fields[0].value.length > 1000) {
                                    embed.fields[0].value = newMessage.content.slice(0, 1000) + "...";
                                }

                                newMessage.guild.channels.cache.get(data.plugins.logs.channel).send({ embed: embed });
                            }
                        });
                    }
                }
            }
        }
    }

    if(!newMessage.content.startsWith(prefix) || newMessage.webhookID || !prefix) return;

    const args = newMessage.content.slice(prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();
    const customCommand = (await require('../models/Command').find({ guildID: newMessage.guild.id })).filter((cmd) => cmd.name.toLowerCase() === commandName)?.[0];
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.help.aliases && cmd.help.aliases.includes(commandName));
    if(!command && !customCommand) return;

    if(!newMessage.guild.me.permissionsIn(newMessage.channel).has("SEND_MESSAGES") || !newMessage.guild.me.permissionsIn(newMessage.channel).has("READ_MESSAGE_HISTORY")) return;

    if(customCommand) {
        const {
            enabled,
            content,
            embed,
            image,
            whitelisted_members,
            whitelisted_roles,
            whitelisted_channels
        } = customCommand;

        if(!enabled) return;
        if(whitelisted_members && !newMessage.member.permissions.has(['ADMINISTRATOR', 'MANAGE_GUILD']) && !whitelisted_members.includes(newMessage.author.id)) return newMessage.channel.send('⚠️ Vous ne pouvez pas utiliser cette commande !');
        if(whitelisted_roles && !newMessage.member.permissions.has(['ADMINISTRATOR', 'MANAGE_GUILD']) && !whitelisted_roles.some((r) => newMessage.member.roles.cache.has(r))) return newMessage.channel.send('⚠️ Vous ne pouvez pas utiliser cette commande !');
        if(whitelisted_channels && !whitelisted_channels.includes(newMessage.channel.id)) return;

        if(embed) {
            embed.timestamp = new Date;
            embed.footer = { text: newMessage.author.tag, icon_url: newMessage.author.displayAvatarURL({ dynamic: true }) };

            if(image) {
                return newMessage.channel.send(parseContent(), { embed, files: [{ attachment: image, name: 'image.png' }] });
            } else {
                return newMessage.channel.send(parseContent(), { embed });
            }
        } else if(image) {
            return newMessage.channel.send(parseContent(), { files: [{ attachment: image, name: 'image.png' }] });
        } else if(content) {
            return newMessage.channel.send(parseContent());
        } else {
            return;
        }

        function parseContent() {
            return content
                ?.replace(/{author}/g, newMessage.author)
                .replace(/{authorname}/g, newMessage.author.username)
                .replace(/{authortag}/g, newMessage.author.tag)
                .replace(/{channel}/g, newMessage.channel);
        }
    }

    if(command.help.botPerms.length > 0) {
        if(!newMessage.guild.me.permissionsIn(newMessage.channel).has(command.help.botPerms)) {
            return newMessage.channel.send(`⚠️ ${newMessage.author}, je n\'ai pas les permissions nécessaires pour faire cette commande. \nJ\'ai besoin des permissions suivantes: ${client.formatPermissions(command.help.botPerms.map(perm => `\`${perm}\``).join(', '))}`)
        }
    }

    if(command.help.memberPerms.length > 0) {
        if(!newMessage.member.permissionsIn(newMessage.channel).has(command.help.memberPerms)) {
            return newMessage.channel.send(`⚠️ ${newMessage.author}, vous n\'avez pas les permissions nécessaires pour faire cette commande!`);
        }
    }

    if(command.help.args && !args.length) {
        return client.commands.get('help').run(client, newMessage, [command.help.name], data);
    }

    if(!client.cooldowns.has(command.help.name)) {
        client.cooldowns.set(command.help.name, new Discord.Collection());
    }

    const tStamps = client.cooldowns.get(command.help.name);
    const cdAdmount = (command.help.cooldown || 0) * 1000;

    if(tStamps.has(newMessage.author.id)) {
        const cdExpirationTime = tStamps.get(newMessage.author.id) + cdAdmount;

        if(Date.now() < cdExpirationTime) {
            timeLeft = (cdExpirationTime - Date.now()) / 1000;
            return newMessage.channel.send(`⚠️ Attendez encore **${timeLeft.toFixed(0)}s** avant de réutiliser cette commande!`)
            .then(async msg => {
                await msg.delete({ timeout: 5000 });
            }).catch(() => {});
        }
    }

    tStamps.set(newMessage.author.id, Date.now());
    setTimeout(() => tStamps.delete(newMessage.author.id), cdAdmount);

    try {
        command.run(client, newMessage, args, data, userData);  
    } catch (error) {
        console.log(error.message);
        newMessage.channel.send(`Une erreur est survenue lors de l\'exécution de la commande. \n\`\`\`js\n${error.message}\n\`\`\``);
        client.channels.cache.get(client.config.support.logs).send(`Une erreur est survenue lors de la commande ${commandName}: \n\`\`\`js\n${error.message}\n\`\`\``);
    }
}
