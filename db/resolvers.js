const Usuario = require('../models/Usuario');
const Proyecto = require('../models/Proyecto');
const Tarea = require('../models/Tarea');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({path: 'variables.env'})

const crearToken = (usuario, secreta, expiresIn) => {
    //console.log(usuario);
    const { id, email, nombre } = usuario;

    return jwt.sign({id, email, nombre}, secreta, {expiresIn})
} 

const resolvers = {
    Query: {
        obtenerProyectos: async (_, {}, ctx) => {
            const proyectos = await Proyecto.find({creador: ctx.id});
            //console.log(proyectos)
            return proyectos;
        },
        obtenerTareas: async (_, {input}, ctx) => {
            const tareas = await Tarea.find({creador: ctx.id}).where('proyecto').equals(input.proyecto);
            return tareas;
        }
    },
    Mutation:{
        crearUsuario: async  (_, {input}) => {
            const {email, password} = input;
            const existeusuario = await Usuario.findOne({email});

            //Si el uasuario no existe
            if(existeusuario){
                throw new Error('El usuario ya esta registrado')
            }

            try {

                //Hashear password
                const salt = await bcryptjs.genSalt(10);
                input.password = await bcryptjs.hash(password, salt)

                //console.log(input);

                //Registrar nuevo usuario
                const nuevoUsuario = new Usuario(input);
                console.log(nuevoUsuario);
                nuevoUsuario.save();
                return "Usuario Creado Correctamente"
            } catch (error) {
                console.log(error)
            }
        } ,
        autenticarUsuario: async  (_, {input}) => {
            const {email, password} = input;

            //Si el usuario existe
            const existeusuario = await Usuario.findOne({email});

            //Si el usuario existe
            if(!existeusuario){
                throw new Error('El usuario no existe');
            }

            //Si el password es correcto
            const passwordCorrecto = await bcryptjs.compare(password, existeusuario.password);

           if(!passwordCorrecto){
               throw new Error('Password incorrecto');
           }

            //Dar acceso a la app
            return {
                token: crearToken(existeusuario, process.env.SECRET, '4hr')
            }
        },

        nuevoProyecto: async (_, {input}, ctx) => {

            //console.log(ctx)
            try {
                const proyecto = new Proyecto(input);

                //asociar el creador 
                proyecto.creador = ctx.id
                //proyecto.creador = ctx.usuario.id

                //almacenarlo en la base de datos
                const resultado = await  proyecto.save();

                return resultado;

            } catch (error) {
                console.log(error)
            }
        },
        actualizarProyecto: async (_, {id, input}, ctx) => {
            //Revisar si el proyecto existe o no 
            let proyecto = await Proyecto.findById(id);

            if(!proyecto){
                throw new Error('Proyecto no encontrado');
            }

            //Revisar si la persona trata de editar es el creador
            if(proyecto.creador.toString() !== ctx.id){
                throw new Error('No tienes las credenciales para editar');
            }

            //Guardar el proyecto
            proyecto = await Proyecto.findOneAndUpdate({_id: id}, input, {new: true});
            //console.log(proyecto.id)
            return proyecto;
        },
        eliminarProyecto: async (_, {id}, ctx) =>{
            //Revisar si el proyecto existe o no 
            let proyecto = await Proyecto.findById(id);

            if(!proyecto){
                throw new Error('Proyecto no encontrado');
            }

            //Revisar si la persona trata de editar es el creador
            if(proyecto.creador.toString() !== ctx.id){
                throw new Error('No tienes las credenciales para eliminar');
            }

            //Eliminar 
            await Proyecto.findOneAndDelete({_id : id});
            return "Proyecto eliminado"
        },
        nuevaTarea : async (_, {input}, ctx) => {
            try {
                const tarea = new Tarea(input);
                tarea.creador = ctx.id;
                const resultado = await tarea.save();
                return resultado;
            } catch (error) {
                console.log(error)
            }
        },
        actualizarTarea: async (_, {id, input, estado}, ctx) => {
            //Si la tarea existe o no
            let tarea = await Tarea.findById(id);

            if(!tarea) {
                throw new Error ('Tarea no encontrada')
            }

            //Si la personal que lo edita es el propietario
            if(tarea.creador.toString() !== ctx.id){
                throw new Error ('No tienes las credenciales para editar')
            }

            //asignar estado
            input.estado = estado;

            //Guardar y retornar la tarea
            tarea =  await Tarea.findOneAndUpdate({_id : id}, input, {new: true})

            return tarea;
        },
        eliminarTarea: async(_, {id}, ctx) => {
            //Revisar si el proyecto existe o no 
            let tarea = await Tarea.findById(id);

            if(!tarea){
                throw new Error('Tarea no encontrada');
            }

            //Revisar si la persona trata de editar es el creador
            if(tarea.creador.toString() !== ctx.id){
                throw new Error('No tienes las credenciales para eliminar');
            }

            //Eliminar 
            await Tarea.findOneAndDelete({_id : id});
            return "Tarea eliminada"
        }
    }
}

module.exports = resolvers;