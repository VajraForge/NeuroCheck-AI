import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from celery.result import AsyncResult
from app.celery_app import celery_app
from app.core.security import get_current_user

router = APIRouter(prefix="/tasks", tags=["Task Status Management"])

@router.get("/{task_id}")
async def get_task_status(task_id: str, current_user: str = Depends(get_current_user)):
    res = AsyncResult(task_id, app=celery_app)
    response = {"task_id": task_id, "status": res.status}
    
    try:
        if res.ready():
            if res.successful():
                response["result"] = res.result
            else:
                response["error"] = str(res.result)
        else:
            response["meta"] = res.info if isinstance(res.info, dict) else {}
    except Exception as e:
        response["status"] = "PENDING"
        response["meta"] = {"note": f"Result query: {str(e)}"}
        
    return response

@router.websocket("/ws/{task_id}")
async def task_status_websocket(websocket: WebSocket, task_id: str):
    await websocket.accept()
    try:
        for _ in range(120):  # 60 seconds max timeout
            res = AsyncResult(task_id, app=celery_app)
            try:
                status = res.status
                payload = {"task_id": task_id, "status": status}
                if res.ready():
                    if res.successful():
                        payload["result"] = res.result
                    else:
                        payload["error"] = str(res.result)
                    await websocket.send_json(payload)
                    break
                else:
                    payload["meta"] = res.info if isinstance(res.info, dict) else {}
                    await websocket.send_json(payload)
            except Exception:
                await websocket.send_json({"task_id": task_id, "status": "PENDING"})
                
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        pass
