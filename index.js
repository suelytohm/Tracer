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


/**
 * ✔ Cadastro Usuário
 * Login
 * Verificar se Usuário está ativo
 * ✔ Salvar os links do user
 * ✔ Ver se o site está online
 * Verificar alterações no Checkout
 * ✔ Automatizar as verificações (verificar a cada meia hora)
 */


app.get('/u', (req, res) => {
    pegarUsers();
})


function pegarUsers() {
    let users = require(execSQLQuery('SELECT * FROM tracer_usuarios', "return"))
    console.log(users.nome);
}


app.post('/clientes', (req, res) =>{
    const nome = req.body.nome.substring(0,150);
    const cpf = req.body.cpf.substring(0,11);
    const email = req.body.email.substring(0,100);
    const senha = req.body.senha.substring(0,100);
    const telefone = req.body.telefone.substring(0,30);
    const plano = req.body.plano.substring(0,1);
    const ativo = req.body.ativo.substring(0,1);

    execSQLQuery(`INSERT INTO tracer_usuarios(nome, cpf, email, senha, telefone, plano, ativo) VALUES('${nome}','${cpf}', '${email}', '${senha}', '${telefone}', '${plano}', '${ativo}');`, res);

});


/** Cadastrar Link */
app.post('/link', (req, res) => {

    let idUser = req.body.idUser;
    let link = req.body.link;
    
    execSQLQuery(`INSERT INTO tracer_links(idUser, link, dataCriacao, statusCode) VALUES('${idUser}','${link}', curdate(), 1);`, res);
})



/** Verificar site online */
app.post('/verificarLink', (req, res) => {

    let idUser = req.body.idUser;
    let link = req.body.link;

    request(link, function (error, response, html) { 
        if (!error && response.statusCode == 200) { 

            historicoMonitoramento(idUser, link, "ok");

            return res.status(response.statusCode).json(
                {
                    "idUser": idUser,
                    "link": link,
                    "status": response.statusCode,
                    "message": "ok"
                })
        } else {
            
            historicoMonitoramento(idUser, link, "Erro");

            return res.status(500).json(
                {
                    "message": "Erro",
                })
        }
    });
})


function monitorar(idUser, link){
    
    let status = "";

    request(link, function (error, response, html) { 
        if (!error && response.statusCode == 200) { 
            status = "ok"
        } else {
            status = "Erro";
        }
    });

    historicoMonitoramento(idUser, link, status);

}


function historicoMonitoramento(idUser, link, status){

    if(status == "ok"){

    }else{
        // notificarUsuario(idUser, link, status);

    }
    
    execSQLQuery(`INSERT INTO tracer_links_historico(idUser, link, dataVerificacao, horaVerificacao, status) VALUES('${idUser}','${link}', curdate(), now(), '${status}');`, "silent");

}






function execSQLQuery(sqlQry, res){
    const connection = mysql.createConnection({
      host     : 'sql10.freemysqlhosting.net',
      port     : 3306,
      user     : 'sql10450242',
      password : 'uVxfyAa5ic',
      database : 'sql10450242'
    });
  
    if(res == "return"){
        connection.query(sqlQry, function(error, results, fields){
            if(error) 
              res.json(error);
            else
              res.json(results);
            connection.end();
            console.log('executou!');
        });
    }else if(res == "silent"){
        connection.query(sqlQry, function(error, results, fields){

            connection.end();
            console.log('executou!');
        });        

    }else{
        connection.query(sqlQry, function(error, results, fields){
            if(error) 
              res.json(error);
            else
              res.json(results);
            connection.end();
            console.log('executou!');
        });
    }




    connection.query('SELECT * from tracer_links_historico', function (error, results, fields) {
        if (error) throw error;
        // console.log('The solution is: ', results[0].tracer_links_historico);
        console.log("results: " + results.data); // results contains rows returned by server
        console.log("fields: " + fields);
      });





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

