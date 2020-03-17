const snGrid = require('@sendgrid/mail');

snGrid.setApiKey(process.env.SENDGRID_API_KEY);

// snGrid.send({
//     to:'alugalasairam@gmail.com',
//     from:'alugalasairam@gmail.com',
//     subject:'This is Test',
//     text:'Hi, kiran.'
// })


module.exports = {
    sendWelcomeEmail(email, name){
        snGrid.send({
            from:'alugalasairam@gmail.com',
            to:email,
            subject:'Welcome to the App.',
            text:`Welcome to Task Manager APP, ${name}. Thnaks for Joining!`
        })
    },

    sednCancellationEmail(email,name){
        snGrid.send({
            from:'alugalasairam@gmail.com',
            to:email,
            subject:'Good Bye',
            text:`Good Bye ${name}` 
        })
    }
}