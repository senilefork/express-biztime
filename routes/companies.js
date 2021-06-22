const express = require("express");
const slugify = require("slugify");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

router.get('/', async (req, res, next) => {
    try {
      const results = await db.query(`SELECT * FROM companies`);
      return res.json({ companies: results.rows })
    } catch (e) {
      return next(e);
    }
  });

router.get('/:code', async(req, res, next) => {
    try{
        const {code} = req.params;
        const results = await db.query(`SELECT * FROM companies WHERE code=$1`, [code]);
        const comp_code = results.rows[0].code
        const invoices = await db.query('SELECT * FROM invoices WHERE comp_code=$1', [comp_code]);
        const industries = await db.query('SELECT companies.code, industries.industry FROM companies LEFT JOIN industries_companies ON companies.code = industries_companies.comp_code LEFT JOIN industries ON industries.code = industries_companies.industry_code WHERE companies.code=$1', [code]);
        const ind = industries.rows.map(i => i.industry)
        if(results.rowCount === 0){
            throw new ExpressError(`Can't find company with code ${code}`, 404);
        }
        return res.json({company: results.rows[0], invoices: invoices.rows, industries: ind})
    } catch(e) {
        return next(e)
    }
});

router.post('/', async(req, res, next) =>{
    try{
        const {name, description} = req.body;
        const code = slugify(name, {replacement:'',lower: true})
        const results = await db.query('INSERT INTO companies (code, name, description) VALUES($1, $2, $3) RETURNING code, name, description', [code, name, description]);
        return res.status(201).json({company: results.rows[0]})
    } catch(e) {
        return next(e);
    }
});

router.put('/:code', async(req, res, next) =>{
    try{
        const {code} = req.params;
        code = slugify(name, {replacement:'',lower: true})
        const {name, description} = req.body;
        const results = await db.query('UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description', [name, description, code]);
        if(results.rowCount === 0){
            throw new ExpressError(`Can't find company with code ${code}`, 404);
        }
        return res.json({company: results.rows[0]})
    }catch(e){
        return next(e)
    }
});

router.delete('/:code', async(req, res, next) =>{
    try{
        const {code} = req.params;
        const results = db.query('DELETE FROM companies WHERE code=$1', [code]);
        return res.json({msg:'DELETED'})
    } catch(e) {
        return next(e);
    }
});

module.exports = router;