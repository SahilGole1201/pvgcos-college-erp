from fastapi import FastAPI, Request

app = FastAPI(title="Mock Notification Module")

@app.post("/api/module-notification")
async def receive_notification(req: Request):
    payload = await req.json()
    print("Received notification payload:")
    import pprint
    pprint.pprint(payload)
    return {"status": "success", "detail": "Notification received by mock module!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8001)
