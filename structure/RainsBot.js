module.exports = class RainsBot extends Client {
    constructor() {
        super({
            disableMentions: 'everyone',
            partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
            restTimeOffset: 250
        });

        this.config = require('../config');
        this.mongoose = mongoose;
        this.games = [];
        this.commands = new Collection();
        this.cooldowns = new Collection();
        this.giveawaysManager = new (require('discord-giveaways').GiveawaysManager)(this, {
            storage: './giveaways.json',
            updateCountdownEvery: 10000,
            default: {
                botsCanWin: false,
                embedColor: this.config.embed.color,
                embedColorEnd: 'RED',
                reaction: '🎉'
            }
        });
        
        CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, heigth, rayon) {
            this.beginPath();
            this.globalAlpha = 0.6;
            this.moveTo(x, y + rayon);
            this.lineTo(x, y + heigth - rayon);
            this.quadraticCurveTo(x, y + heigth, x + rayon, y + heigth);
            this.lineTo(x + width - rayon, y + heigth);
            this.quadraticCurveTo(x + width, y + heigth, x + width, y + heigth - rayon);
            this.lineTo(x + width, y + rayon);
            this.quadraticCurveTo(x + width, y, x + width - rayon, y);
            this.lineTo(x + rayon, y);
            this.quadraticCurveTo(x, y, x, y + rayon);
            this.closePath();
        }
    }

    init() {
        // load commands
        readdirSync('./commands/').forEach(dirs => {
        const commands = readdirSync(`./commands/${dirs}/`).filter(files => files.endsWith('.js'));
    
            for (const file of commands) {
                const fileName = require(`../commands/${dirs}/${file}`);
                this.commands.set(fileName.help.name, fileName);
            }
        });

        console.log(`${this.commands.size} commandes chargées`);

        // load events
        readdir('./events/', (error, f) => {
            if(error) console.error(error);
            console.log(`${f.length} évènements en chargement`);
    
            f.forEach((file) => {
                const events = require(`../events/${file}`);
                const evtName = file.split(".")[0];
    
                this.on(evtName, events.bind(null, this));
            });
        });

        // connect to mongodb
        this.mongoose.connect(process.env.DBCONNECTION, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false,
            autoIndex: false
        }).then(() => console.log('MongoDB s\'est connecté'));

        // login into Discord
        this.login(process.env.TOKEN);

        // DO NOT INIT THE FOLLOWING CODE !!

        // Autopost stats to Top.gg
        AutoPoster(process.env.TOPGGTOKEN, this);
        console.log('Posted stats to Top.gg!');

        // Send message and DM when a user votes for the bot
        app.post('/dblwebhook', webhook.middleware(), async (req, res) => {
            this.users.fetch(req.vote.user).then(async (user) => {
                const dbUser = await this.findOrCreateUser(user);
                if(dbUser) {
                    dbUser.bank = dbUser.bank + 10000;

                    dbUser.markModified("bank");
                    dbUser.save();
                }
                
                const support = this.guilds.cache.get(this.config.support.id)

                if(support.roles.cache.get(this.config.support.voteRole)) {
                    const member = support.members.cache.get(user.id);
                    if(member) await member.roles.add(this.config.support.voteRole);
                }

                this.channels.cache.get(this.config.support.votes).send({
                    embed: {
                        color: this.config.embed.color,
                        description: `**${user.tag}** vient juste de voter pour moi, merci beaucoup ! \nSi vous voulez voter pour moi, cliquez [ici](https://top.gg/bot/${this.user.id}) !`,
                        author: {
                            name: user.username,
                            icon_url: user.displayAvatarURL({ dynamic: true })
                        },
                        footer: {
                            text: this.config.embed.footer,
                            icon_url: this.user.displayAvatarURL()
                        }
                    }
                });

                user.send('Merci d\'avoir voté pour moi ! 10 000$ ont été rajoutés à votre compte en banque.').catch(() => {});
            }).catch(() => this.channels.cache.get(this.config.support.votes).send("Impossible de déterminer qui vient de voter pour moi"));
        });

    	app.listen(80);

        // check for all unmutes
        setInterval(async () => {
            const allUnmutedUser = await User.find({ tempmutes: { $elemMatch: { endsAt: { $lt: Date.now() } } } });
            if(!allUnmutedUser || allUnmutedUser?.length === 0) return;

            allUnmutedUser.forEach(async (user) => {
                for (let i = 0; i < user.tempmutes.length; i++) {
                    const mute = user.tempmutes[i];

                    user.tempmutes = user.tempmutes.filter(m => m.guildID !== mute.guildID);
                    await user.save();

                    const guild = this.guilds.cache.get(mute.guildID);
                    if(!guild || !guild?.available) return;
                    if(!guild.me.hasPermission("MANAGE_ROLES")) return;

                    const data = await this.getGuild(guild);
                    const member = guild.members.cache.get(user.id);
                    if(!member || !data) return;

                    if(member.roles.cache.has(data.muterole)) {
                        member.roles.remove(data.muterole).then(() => {
                            member.send(`Vous avez été unmute du serveur ${guild.name}. Raison: **Automatic unmute**`).catch(() => {});
                        }).catch(() => {});
                    }

                    if(data.plugins.logs.enabled) {
                        const channel = guild.channels.resolve(data.plugins.logs.channel);
                        if(channel) {
                            channel.send({
                                embed: {
                                    color: 'ORANGE',
                                    description: `L'utilisateur **${this.users.cache.get(user.id).tag}** s'est fait unmute. \nRaison: **Automatic unmute**`,
                                    footer: {
                                        text: this.config.embed.footer,
                                        icon_url: this.user.displayAvatarURL()
                                    }
                                }
                            });
                        }
                    }
                }
            });
        }, 10000);

        // Update members count channels every 10 min
        setInterval(async () => {
            (await Guild.find({ "plugins.membercount.parentID": { $ne: null } })).forEach((gData) => {
                this.channels.fetch(gData.plugins.membercount.parentID).then(async (channel) => {
                    const { guild } = channel;
                    if(guild.members.cache.size !== guild.memberCount) await guild.members.fetch();

                    Object.keys(gData.plugins.membercount.channels).forEach(async (type) => {
                        const ch = gData.plugins.membercount.channels[type];
                        const channel = guild.channels.resolve(ch.id);

                        let toUpdate;
                        switch (type) {
                            case 'members': toUpdate = guild.members.cache.filter((m) => !m.user.bot).size; break;
                            case 'bots': toUpdate = guild.members.cache.filter((m) => m.user.bot).size; break;
                            case 'totalMembers': toUpdate = guild.memberCount; break;
                        }

                        if(channel) await channel.edit({ name: ch.name.replace('{count}', toUpdate) });
                    });
                }).catch(() => {});
            });
        }, 1000 * 60 * 10);
    }

    async createGuild(guild) {
        const merged = Object.assign({ _id: mongoose.Types.ObjectId() }, guild);
        const createGuild = await new Guild(merged);
        createGuild.save();
    }

    async getGuild(guild) {
        const data = await Guild.findOne({ id: guild.id })
        if(data) return data;
        return null;
    }

    async updateGuild(guild, data = {}) {
        let data_ = await this.getGuild(guild);
        if(typeof data_ !== "object") data_ = {};
        for (const key in data) {
            if(data_[key] !== data[key]) data_[key] = data[key];
        }
        return data_.updateOne(data);
    }

    get getAllUsers() {
        return this.formatNumber(this.guilds.cache.reduce((a, g) => a + g.memberCount, 0));
    }

    formatPermissions(content) {
        return content.replace("CREATE_INSTANT_INVITE", "Créer une invitation")
            .replace("BAN_MEMBERS", "Bannir des membres")
            .replace("MANAGE_CHANNELS", "Gérer les salons")
            .replace("ADD_REACTIONS", "Ajouter des réactions")
            .replace("PRIORITY_SPEAKER", "Voix prioritaire")
            .replace("SEND_TTS_MESSAGES", "Envoyer des messages TTS")
            .replace("EMBED_LINKS", "Intégrer des liens")
            .replace("READ_MESSAGE_HISTORY", "Voir les anciens messages")
            .replace("USE_EXTERNAL_EMOJIS", "Utiliser des emojis externes")
            .replace("CONNECT", "Se connecter")
            .replace("MUTE_MEMBERS", "Couper le micro des membres")
            .replace("VIEW_CHANNEL", "Voir le salon")
            .replace("MOVE_MEMBERS", "Déplacer des membres")
            .replace("CHANGE_NICKNAME", "Changer le pseudo")
            .replace("MANAGE_ROLES", "Gérer les rôles")
            .replace("MANAGE_EMOJIS", "Gérer les emojis")
            .replace("KICK_MEMBERS", "Expulser des membres")
            .replace("ADMINISTRATOR", "Administrateur")
            .replace("MANAGE_GUILD", "Gérer le serveur")
            .replace("VIEW_AUDIT_LOG", "Voir les logs du serveur")
            .replace("STREAM", "Vidéo")
            .replace("SEND_MESSAGES", "Envoyer des messages")
            .replace("MANAGE_MESSAGES", "Gérer les messages")
            .replace("ATTACH_FILES", "Joindre des fichiers")
            .replace("MENTION_EVERYONE", "Mentionner @\u200beveryone, @\u200bhere et tous les rôles")
            .replace("VIEW_GUILD_INSIGHTS", "Voir les analyses de serveur")
            .replace("SPEAK", "Parler")
            .replace("DEAFEN_MEMBERS", "Mettre en sourdine des membres")
            .replace("USE_VAD", "Utiliser la Détection de voix")
            .replace("MANAGE_NICKNAMES", "Gérer les pseudos")
            .replace("MANAGE_WEBHOOKS", "Gérer les webhooks");
    }

    formatNumber(number) {
        return String(number).replace(/(.)(?=(\d{3})+$)/g, '$1 ');
    }

    formatTicketCount(ticketCount) {
        if(ticketCount < 10) return '000' + ticketCount;
        if(ticketCount < 100) return '00' + ticketCount;
        if(ticketCount < 1000) return '0' + ticketCount;
        else return ticketCount;
    }

    formatLevelUpMessage(message, user, userData = {}) {
        return message
            .replace(/{user}/g, user)
            .replace(/{username}/g, user.username)
            .replace(/{usertag}/g, user.tag)
            .replace(/{level}/g, userData.level)
            .replace(/{exp}/g, userData.exp);
    }

    async updateUserLevel(user, guild, options = {}) {
        await Guild.updateOne({
            id: guild.id, "members.id": user.id
        },
        {
            $set: options
        });
    }

    async findOrCreateUser(user) {
        if(user.bot) return;

        const data = await User.findOne({ id: user.id });
        if(data) return data;
        else {
            const merged = Object.assign({ _id: mongoose.Types.ObjectId() }, user);
            const createUser = await new User(merged);
            createUser.save();
        }
    }

    askEmbed(message, baseEmbed = {}) {
        return new Promise(async (resolve) => {
            const title = await message.channel.send('Quel **titre** voulez-vous donner à votre embed ? (max. 256 chars)\nEnvoyez \'skip\' pour passer cette étape.');
            const filter = (m) => m.author.id === message.author.id;
            message.channel.awaitMessages(filter, { max: 1, time: 30000 })
                .then(async (collectedTitle) => {
                    if(!collectedTitle.first().content) return message.channel.send('❌ Merci de spécifier un texte valide!');

                    await title.delete().catch(() => {});

                    if(collectedTitle.first().content.toLowerCase() !== 'skip') {
                        if(collectedTitle.first().content.length > 256) return message.channel.send('❌ Votre titre est trop long.');

                        baseEmbed.title = collectedTitle.first().content;
                    }

                    await collectedTitle.first().delete().catch(() => {});

                    const color = await message.channel.send('Quelle **couleur** souhaitez-vous mettre à votre embed ? La couleur peut être **hexadécimale** (#7289da), **numérique** (7506394), ou **normale** (blurple).\nEnvoyez \'skip\' pour passer, la couleur par défaut est grise (#2f3136).');

                    message.channel.awaitMessages(filter, { max: 1, time: 20000 })
                        .then(async (collectedColor) => {
                            if(!collectedColor.first().content) return message.channel.send('❌ Merci de spécifier une couleur!');

                            await color.delete().catch(() => {});

                            if(collectedColor.first().content.toLowerCase() !== 'skip') {
                                const isValid = (require('discord.js').Util.resolveColor(collectedColor.first().content.toUpperCase()) === 'NaN') ? false : true;

                                if(!isValid) return message.channel.send('❌ Couleur invalide');

                                baseEmbed.color = require('discord.js').Util.resolveColor(collectedColor.first().content.toUpperCase());
                            } else {
                                baseEmbed.color = '#2f3136';
                            }

                            await collectedColor.first().delete().catch(() => {});

                            const description = await message.channel.send('Quelle **description** souhaitez-vous donner à votre embed ? (max. 2048 chars).\nEnvoyez \'skip\' pour passer cette étape.');

                            message.channel.awaitMessages(filter, { max: 1, time: 50000 })
                                .then(async (collectedDesc) => {
                                    if(!collectedDesc.first().content) return message.channel.send('❌ Merci de spécifier du texte valide!');

                                    await description.delete().catch(() => {});

                                    if(collectedDesc.first().content.toLowerCase() !== 'skip') {
                                        if(collectedDesc.first().content.length > 2048) return message.channel.send('❌ Votre description est trop longue.');

                                        baseEmbed.description = collectedDesc.first().content;
                                    }

                                    await collectedDesc.first().delete().catch(() => {});

                                    const thumbnail = await message.channel.send('Quelle **icône** souhaitez-vous ajouter à votre embed ? Celle-ci peut être une image ou un lien.\nEnvoyer \'skip\' pour passer cette étape.');

                                    message.channel.awaitMessages(filter, { max: 1, time: 30000 })
                                        .then(async (collectedThumbnail) => {
                                            if(!collectedThumbnail.first().content && !collectedThumbnail.first().attachments.first()) return message.channel.send('❌ Merci d\'envoyer une image ou un lien.');

                                            await thumbnail.delete().catch(() => {});

                                            if(collectedThumbnail.first().content.toLowerCase() !== 'skip') {
                                                if(collectedThumbnail.first().attachments.first()) {
                                                    baseEmbed.thumbnail = { url: collectedThumbnail.first().attachments.first().proxyURL };
                                                } else {
                                                    if(!collectedThumbnail.first().content.startsWith('https://')) return message.channel.send('❌ Merci d\'envoyer un lien valide!');

                                                    baseEmbed.thumbnail = { url: collectedThumbnail.first().content };
                                                }   
                                            }

                                            const image = await message.channel.send('Quelle **image** souhaitez-vous attacher à votre embed ? Celle-ci peut être une image ou un lien.\nEnvoyer \'skip\' pour passer cette étape.');

                                            message.channel.awaitMessages(filter, { max: 1, time: 30000 })
                                                .then(async (collectedImage) => {
                                                    if(!collectedImage.first().content && !collectedImage.first().attachments.first()) return message.channel.send('❌ Merci d\'envoyer une image ou un lien.');

                                                    await image.delete().catch(() => {});

                                                    if(collectedImage.first().content.toLowerCase() !== 'skip') {
                                                        if(collectedImage.first().attachments.first()) {
                                                            baseEmbed.image = { url: collectedImage.first().attachments.first().proxyURL };
                                                        } else {
                                                            if(!collectedImage.first().content.startsWith('https://')) return message.channel.send('❌ Merci d\'envoyer un lien valide!');

                                                            baseEmbed.image = { url: collectedImage.first().content };
                                                        }
                                                    }

                                                    if(!baseEmbed.title && !baseEmbed.description && !baseEmbed.image?.url) return message.channel.send('❌ Votre embed doit contenir au moins soit un titre, soit une description, soit une image.');

                                                    return resolve(baseEmbed);
                                                })
                                                .catch(() => message.channel.send('Temps écoulé'));
                                        })
                                        .catch(() => message.channel.send('Temps écoulé'));
                                })
                                .catch(() => message.channel.send('Temps écoulé'));
                        })
                        .catch(() => message.channel.send('Temps écoulé'));
                })
                .catch(() => message.channel.send('Temps écoulé'));
        });
    }
}
