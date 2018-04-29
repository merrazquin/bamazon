
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

let productCache

class BamazonProductManager {
    constructor(callback) {
        connection.connect(err => {
            if (err) throw err

            if(callback != undefined) {
                callback()
            }
        })
    }
    getAllProducts(callback) {
        connection.query(
            `SELECT * 
            FROM products`,
            (error, results, fields) => {
                if (error) throw error

                productCache = results

                if (callback != undefined) {
                    callback(productCache)
                }
            })
    }

    getLowInventory(callback) {
        connection.query(
            `SELECT * 
            FROM products 
            WHERE stock_quantity < 5`,
            (error, results, fields) => {
                if (error) throw error

                if (callback != undefined) {
                    callback(results)
                }
            })
    }

    getAllDepartments(callback) {
        connection.query(
            `SELECT d.department_id, d.department_name, d.over_head_costs, SUM(COALESCE(p.product_sales, 0)) as product_sales, 
                    SUM(COALESCE(p.product_sales, 0)) - d.over_head_costs as total_profit 
            FROM departments d 
            LEFT JOIN products p ON d.department_name = p.department_name 
            GROUP BY d.department_name 
            ORDER BY d.department_id`,
            (error, results, fields) => {
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
            table.push([product.item_id, product.product_name.bold, product.department_name, currencyFormatter.format(product.price, { code: 'USD' }), product.stock_quantity])
        })

        console.log(table.toString())
    }

    displayDepartments(departments) {
        let table = new Table({
            head: ['ID', 'Name', 'Overhead Costs', 'Product Sales', 'Total Profit']
        })
        departments.forEach(department => {
            table.push([department.department_id, department.department_name.bold, currencyFormatter.format(department.over_head_costs, { code: 'USD' }), currencyFormatter.format(department.product_sales, { code: 'USD' }), currencyFormatter.format(department.total_profit, { code: 'USD' })[department.total_profit > 0 ? "green" : "red"]])
        })
        console.log(table.toString())
    }

    processOrder(id, qty, price, callback) {
        connection.query(
            `UPDATE products 
            SET stock_quantity = stock_quantity - ?, 
                product_sales = product_sales + ? 
            WHERE item_id = ?`,
            [qty, parseFloat((qty * price).toFixed(2)), id], (error, results, fields) => {
                if (error) throw error

                console.log('Purchase total:'.bold.green, currencyFormatter.format(qty * price, { code: 'USD' }).green)

                this.getAllProducts(callback)
            })
    }

    addToInventory(id, qty, callback) {
        connection.query(
            `UPDATE products 
            SET stock_quantity = stock_quantity + ? 
            WHERE item_id = ?`,
            [qty, id], (error, results, fields) => {
                if (error) throw error

                this.getAllProducts(callback)
            })
    }

    addNewDepartment(name, overhead, callback) {
        connection.query(
            `INSERT INTO departments SET ?`,
            {
                department_name: name,
                over_head_costs: overhead
            },
            (error, results, fields) => {
                if (error) throw error

                this.getAllDepartments(callback)
            })
    }

    addNewProduct(name, department, price, qty, callback) {
        connection.query(
            `INSERT INTO products SET ?`,
            {
                product_name: name,
                department_name: department,
                price: price,
                stock_quantity: qty
            },
            (error, results, fields) => {
                if (error) throw error

                this.getAllProducts(callback)
            })
    }

    findProductById(id) {
        if (!productCache) return null

        return productCache.find(product => { return product.item_id == id })
    }

    exit() {
        connection.end()
    }

}

module.exports = BamazonProductManager