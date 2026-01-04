@echo off
REM Export local database to SQL file (Windows version)

REM Set your local database credentials
set LOCAL_DB_URL=postgresql://postgres:password@localhost:5432/wordigo

REM Create filename with timestamp
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set OUTPUT_FILE=wordigo-backup-%mydate%-%mytime%.sql

echo Exporting database to %OUTPUT_FILE%...

REM Export using pg_dump
pg_dump "%LOCAL_DB_URL%" --no-owner --no-privileges --clean --if-exists > "%OUTPUT_FILE%"

echo.
echo Database exported successfully!
echo File: %OUTPUT_FILE%
echo.
echo To import to Render:
echo psql YOUR_RENDER_DATABASE_URL ^< %OUTPUT_FILE%
