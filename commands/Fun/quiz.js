const quizs = require('../../quiz.json');

module.exports.run = (client, message) => {
    const quiz = quizs[Math.floor(Math.random() * quizs.length)];

    const filter = reponse => quiz.reponses.some(res => reponse.content.toLowerCase().includes(res.toLowerCase()));

    message.channel.send(quiz.question).then(() => {
        message.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] })
		.then(collected => {
			if(collected.first().author.bot) return;
			message.channel.send(`${collected.first().author} a eu la bonne réponse !`);
		})
		.catch(() => {
			message.channel.send('Personne n\'a su répondre au quiz. La réponse était: ' + quiz.reponses[0]);
		})
    })
}

module.exports.help = {
    name: "quiz",
    aliases: ["quiz", "quizz", "quizs"],
    category: "Fun",
    description: "Faites un quiz !",
    usage: "",
    cooldown: 5,
    memberPerms: [],
    botPerms: [],
    args: false
}
