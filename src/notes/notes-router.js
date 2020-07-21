const express = require('express')
const NotesService = require('./notes-service')

const notesRouter = express.Router()
const jsonParser = express.json()
const xss = require('xss')
const path = require('path')

notesRouter
    .route('/')
    .get((req, res, next) => {
        NotesService.getAllNotes(
            req.app.get('db')
        )
            .then(notes => {
                res.json(notes)
            })
            .catch(next)
    })

    .post(jsonParser, (req, res, next) => {
        const { title, folder_id, content } = req.body
        const newNote = { title, folder_id, content }
        for (const [key, value] of Object.entries(newNote)) {
            if (value == null) {
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body` }
                })
            }
        }
        newNote.title = title
        NotesService.insertNote(
            req.app.get('db'),
            newNote
        )
            .then(note => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${note.id}`))
                    .json(note)
            })
            .catch(next)
    })

notesRouter.route('/:note_id')
    .all((req, res, next) => {
        NotesService.getById(
            req.app.get('db'),
            req.params.note_id
        )
            .then(note => {
                if (!note) {
                    return res.status(404).json({
                        error: { message: `Note doesn't exist` }
                    })
                }
                res.note = note
                next()
            })
            .catch(next)
    })

    .get((req, res, next) => {
        res.json({
            id: res.note.id,
            title: xss(res.note.title),
            content: xss(res.note.content),
        })
    })

    .delete((req, res, next) => {
        NotesService.deleteNote(
            req.app.get('db'),
            req.params.note_id
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })

    .patch(jsonParser, (req, res, next) => {
        const { title, content } = req.body
        console.log(req.body)
        const noteToUpdate = { title, content }
        const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length
        if (!numberOfValues) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain either 'title' or 'content`
                }
            })
        }
        NotesService.updateNote(
            req.app.get('db'),
            req.params.note_id,
            noteToUpdate
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = notesRouter