
const Sequelize = require('sequelize');
const config = require('../config');

let sequelize = null;
function connect(){
    console.log(`Connecting db with url: ${config.DB_URL}...` )

    sequelize = new Sequelize(config.DB_URL,{dialectOptions: {
        charset: 'utf8',
    }});
    sequelize.authenticate().then(() => {
	
        console.log("Connection has been established successfully.");
    })
    .catch(err => {
        console.error("Unable to connect to the database:", err);
    });
}

function query(sql,bind){
    return sequelize.query(sql, { type: sequelize.QueryTypes.SELECT,bind })
}

connect();

module.exports={
    query
}
