const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000;
const mysql = require('mysql');
const axios = require('axios')

const cheerio = require('cheerio')



app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors());
app.set('view engine', 'html');


/**
 * -------------- USER --------------
 * 
 * ✔ Cadastro Usuário
 * Login
 * Verificar se Usuário está ativo
 * 
 * -------------- LINK --------------
 * 
 * ✔ Salvar os links do usuário
 * ✔ Ver se o site está online
 * ✔ Automatizar as verificações (30 min)
 * Verificar alterações no Checkout
 * 
 */


 app.get('/u', async (req, res) => {
    const usuarios = await pegarUsers();

    usuarios.forEach(user => { 
        console.log(user.nome) 
    })


    res.json(usuarios);
})


function pegarUsers() {
    return connectionBanco("SELECT * FROM tracer_usuarios");
}



app.post('/clientes', (req, res) =>{
    const nome = req.body.nome.substring(0,150);
    const cpf = req.body.cpf.substring(0,11);
    const email = req.body.email.substring(0,100);
    const senha = req.body.senha.substring(0,100);
    const telefone = req.body.telefone.substring(0,30);
    const plano = req.body.plano.substring(0,1);
    const ativo = req.body.ativo.substring(0,1);

    connectionBanco(`INSERT INTO tracer_usuarios(nome, cpf, email, senha, telefone, plano, ativo) VALUES('${nome}','${cpf}', '${email}', '${senha}', '${telefone}', '${plano}', '${ativo}');`);

});


/** Cadastrar Link */
app.post('/link', (req, res) => {

    let idUser = req.body.idUser;
    let link = req.body.link;
    
    connectionBanco(`INSERT INTO tracer_links(idUser, link, dataCriacao, statusCode) VALUES('${idUser}','${link}', curdate(), 1);`)
    
})

app.get('/links', async (req, res) => {
    let linkUsers = [];
    const links = await pegarLinks();

    links.forEach(results => { 
        linkUsers.push(results.link)
        console.log(results.link) 
    })

    res.json(links);
})




/** Verificar site online */
app.post('/verificarLink', (req, res) => {

    let idUser = req.body.idUser;
    let link = req.body.link;


    axios.get(link)
    .then(function (response) {
        historicoMonitoramento(idUser, link, "ok");
        return res.status(response.status).json(response)
    })
    .catch(function (err) {
        historicoMonitoramento(idUser, link, "Erro");
        console.log("Entrou com erro")
        return res.status(500).json(err)
    })
})


async function monitorar(){

    console.log("Monitoramento Iniciado");

    const links = await pegarLinks();

    links.forEach(results => { 

        axios.get(results.link)
        .then(function (response) {
            historicoMonitoramento(results.idUser, results.link, "ok");    
        })
        .catch(function (err) {
            historicoMonitoramento(results.idUser, results.link, "Erro");
        })
    })

    console.log("Verificação Realizada!")

}


function historicoMonitoramento(idUser, link, status){

    if(status !== "ok"){

        // notificarUsuario(idUser, link, status);
    }
    
    connectionBanco(`INSERT INTO tracer_links_historico(idUser, link, dataVerificacao, horaVerificacao, status) VALUES('${idUser}','${link}', curdate(), now(), '${status}');`);

}




function pegarLinks() {
    return connectionBanco("SELECT * FROM tracer_links WHERE ativo = 'S';");
}





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
                console.log("erro");

                reject(
                    error
                )                
            }
            else{
                console.log(results);
                resolve(
                    results
                )
                connection.end();
            }
              
        });
    })
}

  
app.listen(port, (erro) =>{
    if(!erro){
        console.log("Server rodando na porta " + port);

        monitorar();

        setInterval(function() {
            monitorar();
            
        }, 1800000); // 1800000 (MEIA HORA)
    }else{
        console.log(erro)
    }
})

