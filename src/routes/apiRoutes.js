const router = require('express').Router();
const verifyJWT = require('../services/verifyJWT');
const userController = require('../controllers/userController');
const organizadorController = require('../controllers/organizadorController');
const eventoController = require('../controllers/eventoController');
const ingressoController = require('../controllers/ingressoController');
const upload = require("../services/upload");

router.post('/user', userController.createUser);
router.get('/user',verifyJWT, userController.getAllUsers);
router.put('/user/', userController.updateUser);
router.delete('/user/:id', userController.deleteUser);
router.post("/login", userController.loginUser); 

router.post('/organizador', organizadorController.createOrganizador);
router.get('/organizador', organizadorController.getAllOrganizadores);
router.put('/organizador', organizadorController.updateOrganizador);
router.delete('/organizador/:id', organizadorController.deleteOrganizador);

router.post("/evento", upload.single("imagem"), eventoController.createEvento);
router.get('/evento', eventoController.getAllEventos);
router.put('/evento', eventoController.updateEvento);   
router.delete('/evento/:id', eventoController.deleteEvento);
router.get('/evento/sete/:data', verifyJWT, eventoController.getEventosDias);
router.get("/evento/imagem/:id", eventoController.getImagemEvento);



router.post('/ingresso', ingressoController.createIngresso);
router.get('/ingresso', ingressoController.getAllIngressos);
router.get('/ingresso/evento/:id', ingressoController.getByIdEvento);
router.put('/ingresso', ingressoController.updateIngresso);
router.delete('/ingresso/:id', ingressoController.deleteIngresso);

module.exports = router;
