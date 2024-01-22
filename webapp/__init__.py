from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os, random

db = SQLAlchemy()
health_db = 'database.db'





def initialize():
    fl = Flask(__name__)
    random.seed(0)
    fl.config['SECRET_KEY'] = os.urandom(24)
    fl.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{health_db}'
   
   
    fl.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
    db.init_app(fl)
    from .look import look
    from .pred import pred
    
    
    from .alerts import alerts
    fl.register_blueprint(look, url_prefix='/')
    fl.register_blueprint(pred, url_prefix='/')

    
    
    fl.register_blueprint(alerts, url_prefix='/')

    from .model import Alerts

    init_db(fl)



    return fl


def init_db(fl):
    if not os.path.exists('webapp/' + health_db):
        with fl.app_context():
            db.create_all(fl=fl)

