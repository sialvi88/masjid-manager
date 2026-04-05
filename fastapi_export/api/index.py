from fastapi import FastAPI, Request, Form, Depends, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse, FileResponse
from fastapi.templating import Jinja2Templates
from mangum import Mangum
from sqlalchemy import create_engine, Column, Integer, String, Float, Date
from sqlalchemy.orm import declarative_base, sessionmaker, Session
import os
from datetime import date

# Database Setup (Vercel Postgres / Supabase)
# Replace this URL with your actual Vercel Postgres or Supabase connection string
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db") 
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Donation(Base):
    __tablename__ = "donations"
    id = Column(Integer, primary_key=True, index=True)
    donor_name = Column(String, index=True)
    amount = Column(Float)
    date = Column(Date)

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, index=True)
    amount = Column(Float)
    date = Column(Date)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI()

# Adjust template directory path for Vercel environment
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.post("/admin/login")
async def login(username: str = Form(...), password: str = Form(...)):
    if username == "admin" and password == "admin123":
        response = RedirectResponse(url="/dashboard", status_code=302)
        response.set_cookie(key="session", value="admin_logged_in")
        return response
    return HTMLResponse("Invalid credentials", status_code=401)

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request, db: Session = Depends(get_db)):
    donations = db.query(Donation).all()
    expenses = db.query(Expense).all()
    total_donations = sum(d.amount for d in donations)
    total_expenses = sum(e.amount for e in expenses)
    return templates.TemplateResponse("dashboard.html", {
        "request": request, 
        "total_donations": total_donations,
        "total_expenses": total_expenses
    })

@app.get("/donations", response_class=HTMLResponse)
async def view_donations(request: Request, db: Session = Depends(get_db)):
    donations = db.query(Donation).all()
    return templates.TemplateResponse("donations.html", {"request": request, "donations": donations})

@app.post("/donation")
async def add_donation(donor_name: str = Form(...), amount: float = Form(...), date_str: str = Form(...), db: Session = Depends(get_db)):
    new_donation = Donation(donor_name=donor_name, amount=amount, date=date.fromisoformat(date_str))
    db.add(new_donation)
    db.commit()
    return RedirectResponse(url="/donations", status_code=302)

@app.get("/expenses", response_class=HTMLResponse)
async def view_expenses(request: Request, db: Session = Depends(get_db)):
    expenses = db.query(Expense).all()
    return templates.TemplateResponse("expenses.html", {"request": request, "expenses": expenses})

@app.post("/expense")
async def add_expense(description: str = Form(...), amount: float = Form(...), date_str: str = Form(...), db: Session = Depends(get_db)):
    new_expense = Expense(description=description, amount=amount, date=date.fromisoformat(date_str))
    db.add(new_expense)
    db.commit()
    return RedirectResponse(url="/expenses", status_code=302)

@app.get("/reports", response_class=HTMLResponse)
async def reports_page(request: Request):
    return templates.TemplateResponse("reports.html", {"request": request})

@app.get("/reports/excel")
async def download_excel():
    # Placeholder for openpyxl logic
    return {"message": "Excel report will be generated here"}

@app.get("/reports/pdf")
async def download_pdf():
    # Placeholder for reportlab logic
    return {"message": "PDF report will be generated here"}

@app.get("/reports/image")
async def download_image():
    # Placeholder for pillow logic
    return {"message": "JPG report will be generated here"}

# Mangum adapter for Vercel Serverless Functions
handler = Mangum(app)
