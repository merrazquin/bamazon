
require('dotenv').config()
const Table = require('cli-table'),
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

class BamazonProductManager {
    getAllProducts(callback) {
        connection.query('SELECT * FROM products', (error, results, fields) => {
            if (error) throw error

            productCache = results

            if (callback != undefined) {
                callback(productCache)
            }
        })
    }

    getLowInventory(callback) {
        connection.query('SELECT * FROM products WHERE stock_quantity < 5', (error, results, fields) => {
            if (error) throw error

            if (callback != undefined) {
                callback(results)
            }
        })
    }

    displayProducts(products) {
        let table = new Table({
            head: ['ID', 'Name', 'Department', 'Price', 'Stock']
        })
        products.forEach(product => {
            table.push([product.item_id, product.product_name, product.department_name, currencyFormatter.format(product.price, { code: 'USD' }), product.stock_quantity])
        })

        console.log(table.toString())
    }

    processOrder(id, qty, price, callback) {
        connection.query('UPDATE products SET stock_quantity = stock_quantity - ?, product_sales = product_sales + ? WHERE item_id = ?', [qty, parseFloat((qty * price).toFixed(2)), id], (error, results, fields) => {
            if (error) throw error

            console.log('Purchase total:'.bold, currencyFormatter.format(qty * price, { code: 'USD' }).green)

            this.getAllProducts(callback)
        })
    }

    addToInventory(id, qty, callback) {
        connection.query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE item_id = ?', [qty, id], (error, results, fields) => {
            if (error) throw error

            this.getAllProducts(callback)
        })
    }

    addNewProduct(name, category, price, qty, callback) {
        connection.query('INSERT INTO products (product_name, department_name, price, stock_quantity) VALUES (?, ?, ?, ?)', [name, category, price, qty, callback], (error, results, fields) => {
            if (error) throw error

            this.getAllProducts(callback)
        })
    }

    findProductById(id) {
        if (!productCache) return null

        return productCache.find(product => { return product.item_id == id })
    }

}

module.exports = BamazonProductManager