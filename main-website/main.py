import datetime
import os
from flask import Flask, render_template
from db_instance import get_db
from services import home_service, components_service
from routes.about import about_bp
from routes.registration import registration_bp
from routes.guideforauthors import guide_for_authors_bp
from routes.program import program_bp
from routes.contact import contact_bp
from models.article_model import ArticleModel, ArticleStatus


app = Flask(__name__)
app.secret_key = 'conference_2024secretkey'

# Set default values if environment variables are not set
app.config['website_title'] = os.getenv('website_title', 'None')
app.config['navbar_title'] = os.getenv('navbar_title', 'None')
app.config['domain'] = os.getenv('domain', 'http://localhost')

app.register_blueprint(about_bp)
app.register_blueprint(registration_bp)
app.register_blueprint(guide_for_authors_bp)
app.register_blueprint(program_bp)
app.register_blueprint(contact_bp)


@app.errorhandler(404)
def page_not_found(e):
    return render_template('pages/404.html', website_title=app.config['website_title'], 
                           navbar_title=app.config['navbar_title'], 
                           domain=app.config['domain']), 404

@app.route("/")
def WebComponents():
    home = home_service.get_home_data()
    components = components_service.get_all_components()
    return render_template('index.html', home=home, domain=app.config['domain'], components=components)


if __name__ == '__main__':
    
    app.run(debug=True)
