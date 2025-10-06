const express = require('express')
const { body } = require('express-validator')
const auth = require('../middleware/auth')
const { signup, login, me, adminLogin, logout } = require('../controllers/authController')

const router = express.Router()

router.post(
  '/signup',
  [
    body('name').isString().trim().isLength({ min: 2 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 6 })
  ],
  signup
)

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 6 })
  ],
  login
)

router.get('/me', auth(), me)
router.post('/logout', auth(), logout)

// HttpOnly cookie management routes
router.post('/set-cookie', require('../controllers/cookieController').setCookie)
router.post('/clear-cookie', require('../controllers/cookieController').clearCookie)
router.get('/test-cookie', require('../controllers/cookieController').testCookie)

// Hidden admin login route - requires admin code
router.post(
  '/admin-login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 6 }),
    body('adminCode').isString().isLength({ min: 1 })
  ],
  adminLogin
)

module.exports = router

