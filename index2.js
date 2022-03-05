const express = require('express');
const app = express();
const cors = require('cors');
const cheerio = require('cheerio')
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000;
const mysql = require('mysql');

const cron = require('node-cron');
const request = require('request'); 




app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors());
app.set('view engine', 'html');

let linkUsers = [];


app.get('/u', async (req, res) => {
    const usuarios = await pegarUsers();

    usuarios.forEach(user => { 
        console.log(user.nome) 
    })


    res.json(usuarios);
})



app.get('/links', async (req, res) => {
    const links = await pegarLinks();

    links.forEach(results => { 
        linkUsers.push(results.link)
        console.log(results.link) 
    })

    res.json(links);
})



app.get('/todosLinks', async (req, res) => {

    console.log(linkUsers)
    res.json(linkUsers);
})





function connectionBanco(sqlQry){
    return new Promise((resolve, reject) => {

        const connection = mysql.createConnection({
            host     : 'sql10.freemysqlhosting.net',
            port     : 3306,
            user     : 'sql10450242',
            password : 'uVxfyAa5ic',
            database : 'sql10450242'
          });

          connection.query(sqlQry, function(error, results, fields){
            if(error) {
                reject(
                    error
                )                
            }
            else{
                resolve(
                    results
                )
                connection.end();
                console.log('executou!');
            }
              
        });
    })
}


function pegarUsers() {
    return connectionBanco("SELECT * FROM tracer_usuarios");
}


function pegarLinks() {
    return connectionBanco("SELECT * FROM tracer_links");
}






app.listen(port, (erro) =>{
    if(!erro){
        console.log("Server rodando na porta " + port);

        setInterval(function() {
            monitorar(1,"https://americanas.com.br");
            console.log("Monitorando");
            
        }, 1800000); // 1800000 (MEIA HORA)
    }else{
        console.log(erro)
    }
})

