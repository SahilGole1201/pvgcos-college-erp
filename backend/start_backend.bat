@echo off
cd c:\ERP-E_R\backend
call venv\Scripts\activate.bat
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
