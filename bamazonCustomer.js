const INSUFFICIENT_MSG = 'Insufficient quantity!'

require('dotenv').config()
const Table = require('cli-table'),
    inquirer = require('inquirer'),
    currencyFormatter = require('currency-formatter'),
    colors = require('colors'),
    mysql = require('mysql'),
    connection = mysql.createConnection({
        host: 'localhost',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'bamazon'
    })
connection.connect()

let productCache

function displayProducts() {
    connection.query('SELECT * FROM products', (error, results, fields) => {
        if (error) throw error

        productCache = results

        let table = new Table({
            head: ['ID', 'Name', 'Department', 'Price', 'Stock']
        })
        results.forEach(product => {
            table.push([product.item_id, product.product_name, product.department_name, currencyFormatter.format(product.price, { code: 'USD' }), product.stock_quantity])
        })

        console.log(table.toString())

        promptSale()
    })
}

function promptSale() {
    inquirer.prompt([
        {
            type: 'input',
            name: 'id',
            message: 'Enter the product ID',
            validate: input => {
                if (isNaN(input)) {
                    return 'Please enter a numbrer'
                }

                if (!findProductById(input)) {
                    return 'Please enter a valid product number'
                }

                return true
            }
        },
        {
            type: 'input',
            name: 'qty',
            message: 'Enter the quantity',
            validate: input => {
                if (isNaN(input)) {
                    return 'Please enter a number'
                }

                return true
            }
        }
    ]).then(response => {
        let product = findProductById(response.id)
        if (!product) {
            console.log('Product not found')
            promptSale()
        } else if (product.stock_quantity < parseInt(response.qty)) {
            console.log(INSUFFICIENT_MSG)
            console.log('*'.repeat(INSUFFICIENT_MSG.length))
            promptSale()
        } else {
            processOrder(product.item_id, response.qty, product.price)
        }
    })
}

function processOrder(id, qty, price) {
    connection.query('UPDATE products SET stock_quantity = stock_quantity - ' + qty + ' WHERE item_id = ' + id, (error, results, fields) => {
        if (error) throw error

        console.log('Purchase total:'.bold, currencyFormatter.format(qty * price, { code: 'USD' }).green)
        displayProducts()
    })
}

function findProductById(id) {
    if (!productCache) return null

    return productCache.find(product => { return product.item_id == id })
}

displayProducts()

// connection.end()