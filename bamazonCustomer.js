require('dotenv').config()
const Table = require('cli-table'),
    mysql = require('mysql'),
    connection = mysql.createConnection({
        host: 'localhost',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'bamazon'
    })

connection.connect()

function displayProducts() {
    connection.query('SELECT * FROM products', function (error, results, fields) {
        if (error) throw error;

        let table = new Table({
            head: ['ID', 'Name', 'Department', 'Price', 'Stock']
        })
        results.forEach(product => {
            table.push([product.item_id, product.product_name, product.department_name, product.price, product.stock_quantity])
        });

        console.log(table.toString())
    })
}

displayProducts()


connection.end();