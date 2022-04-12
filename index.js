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


app.get('/usuarios', async (req, res) => {
    const usuarios = await pegarUsers();

    usuarios.forEach(user => { 
        console.log(user.nome) 
    })


    res.json(usuarios);
})



app.post('/clientes', async (req, res) =>{
    const nome = req.body.nome.substring(0,150);
    const cpf = req.body.cpf.substring(0,11);
    const email = req.body.email.substring(0,100);
    const senha = req.body.senha.substring(0,100);
    const telefone = req.body.telefone.substring(0,30);
    const plano = req.body.plano.substring(0,1);
    const ativo = req.body.ativo.substring(0,1);

    const salvarClientes = await salvarClient(nome, cpf, email, senha, telefone, plano, ativo);

    res.json(salvarClientes);


});


/** Cadastrar Link */
app.post('/link', async (req, res) => {

    let idUser = req.body.idUser;
    let link = req.body.link;
    
    let salvar = await salvarLinks(idUser, link);

    res.json(salvar);
    
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



app.get('/verificar', async (req, res) => {
    let resposta = await monitorar();

    if(resposta === null) {
        return res.status(404).json({"message": "Erro"})
    }
    console.log(resposta)
    res.json(resposta)

})


/** Verificar site online */
app.post('/verificarLink', async (req, res) => {

    let idUser = req.body.idUser;
    let link = req.body.link;

    console.log(idUser, link, "VERIFICANDO");

    let linksVerificados = await verificarLink(idUser, link);
    
    res.json(linksVerificados)
})




async function monitorar(){

    console.log("Monitoramento Iniciado");

    const links = await pegarLinks();

    links.forEach(results => { 

        axios.get(results.link)
        .then(function (response) {
            historicoMonitoramento(results.idUser, results.link, "ok");
            return response    
        })
        .catch(function (err) {
            historicoMonitoramento(results.idUser, results.link, "Erro");
            return err    

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


function pegarUsers() {
    return connectionBanco("SELECT * FROM tracer_usuarios");
}

function pegarLinks() {
    return connectionBanco("SELECT * FROM tracer_links WHERE ativo = 'S';");
}


function salvarLinks(idUsuario, link) {
    return connectionBanco(`INSERT INTO tracer_links(idUser, link, dataCriacao, statusCode) VALUES('${idUsuario}','${link}', curdate(), 1);`);
}


function salvarClient(nome, cpf, email, senha, telefone, plano, ativo){
    return connectionBanco(`INSERT INTO tracer_usuarios(nome, cpf, email, senha, telefone, plano, ativo) VALUES('${nome}','${cpf}', '${email}', '${senha}', '${telefone}', '${plano}', '${ativo}');`);
}

async function verificarLink(idUser, link){
    let resposta = await axios.get(link)
    .then(function (response) {
        historicoMonitoramento(idUser, link, "ok");
        return response
    })
    .catch(function (err) {
        historicoMonitoramento(idUser, link, "Erro");
        return err
    })

    return resposta;
        
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

