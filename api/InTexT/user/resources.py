from flask_restful import Resource
from flask import session, request
from InTexT.user.models import User
from flask_login import login_user, logout_user, login_required
from InTexT.user.encrypt import decrypt


class UserRegistration(Resource):
    def post(self):
        if User.query.filter_by(username=request.form['username']).first():
            return {'message': 'User {} already exists'.format(request.form['username'])}

        user = User()
        args = {}
        args['username'] = request.form['username']
        args['password'] = request.form['password']
        args['email'] = request.form['email']
        try:
            user.save(args)
            return {
                'message': 'User {} was created'.format(request.form['username']),
            }
        except:
            return {'message': 'Something went wrong'}, 500


class UserLogin(Resource):
    def post(self):
        user = User.query.filter_by(username=request.form['username']).first()
        if user:
            if decrypt(request.form['password'], user.password):
                login_user(user)

                return {'token': session['_id']}, 200
            else:
                return {'message': {'password': 'password is wrong'}}, 400
        else:
            return {'message': {'username': 'no user'}}, 400


class UserLogout(Resource):
    @login_required
    def get(self):
        logout_user()
        return {'status': 200}
