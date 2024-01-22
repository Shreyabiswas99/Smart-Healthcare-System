from . import db
from sqlalchemy.sql import func


class Alerts(db.Model):
	
	d = db.Column(db.DateTime(timezone=True), default=func.now())
	id = db.Column(db.Integer, primary_key=True)
	e = db.Column(db.String(150))
	n = db.Column(db.String(150))
	
	alerts = db.Column(db.String(10000))

	def __str__(self):

		return self.n
	
