import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const API_URI = import.meta.env.VITE_API_URL;


const COLUMNS = ['Applied', 'OA', 'Interview', 'Offer', 'Rejected', 'Accepted'];

const KanbanBoard = () => {

    const navigate = useNavigate();
  
    useEffect(() => {
        if (!localStorage.getItem('token')) {
        navigate('/login');
        }
    }, [navigate]);

    const token = localStorage.getItem('token');

    const [boardData, setBoardData] = useState({
        'Applied': [], 'OA': [], 'Interview': [], 'Offer': [], 'Rejected': [], 'Accepted': []
    });

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                
                const res = await axios.get(`${API_URI}/api/applications`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                
                
                const groupedData = {
                    'Applied': [], 'OA': [], 'Interview': [], 'Offer': [], 'Rejected': [], 'Accepted': []
                };
                
                res.data.forEach(app => {
                    if (groupedData[app.status]) {
                        groupedData[app.status].push(app);
                    }
                });
                
                setBoardData(groupedData);
            } catch (error) {
                console.error("Failed to load applications:", error);
            }
        };
        fetchApplications();
    }, []);

    const onDragEnd = async (result) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;

        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const previousBoardData = { ...boardData };

        const sourceColumn = source.droppableId;
        const destColumn = destination.droppableId;
        const sourceItems = Array.from(boardData[sourceColumn]);
        const destItems = Array.from(boardData[destColumn]);
        
        const [movedItem] = sourceItems.splice(source.index, 1);
        
        if (sourceColumn === destColumn) {
            sourceItems.splice(destination.index, 0, movedItem);
            setBoardData({
                ...boardData,
                [sourceColumn]: sourceItems
            });
        } else {
            const updatedItem = { ...movedItem, status: destColumn }; 
            destItems.splice(destination.index, 0, updatedItem);
            setBoardData({
                ...boardData,
                [sourceColumn]: sourceItems,
                [destColumn]: destItems
            });

            try {
                await axios.put(`${API_URI}/api/applications/${draggableId}/status`, {
                    status: destColumn
                }, {
                    headers : {
                        Authorization : `Bearer ${token}`
                    }
                });
            } catch (error) {
                console.error("❌ Failed to update status in DB:", error);
                
                setBoardData(previousBoardData);
                
                alert("Network error: Failed to save application status. The card has been reverted.");
            }
        }
    };

    return (
        <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', padding: '20px' }}>
            <DragDropContext onDragEnd={onDragEnd}>
                {COLUMNS.map((columnId) => (
                    <div key={columnId} style={{ minWidth: '300px', backgroundColor: '#f4f5f7', padding: '15px', borderRadius: '8px' }}>
                        <h3 style={{ textTransform: 'uppercase', marginBottom: '15px', color: '#5e6c84' }}>
                            {columnId} ({boardData[columnId].length})
                        </h3>
                        
                        <Droppable droppableId={columnId}>
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    style={{ minHeight: '500px' }}
                                >
                                    {boardData[columnId].map((app, index) => (
                                        <Draggable key={app._id} draggableId={app._id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    style={{
                                                        padding: '16px',
                                                        margin: '0 0 12px 0',
                                                        backgroundColor: snapshot.isDragging ? '#e6fcff' : '#ffffff',
                                                        borderRadius: '4px',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                                                        ...provided.draggableProps.style
                                                    }}
                                                >
                                                    <h4 style={{ margin: '0 0 8px 0' }}>{app.role}</h4>
                                                    <p style={{ margin: '0', color: '#666' }}>{app.companyName}</p>
                                                    {app.location?.city && (
                                                        <small style={{ color: '#999' }}>{app.location.city}, {app.location.country}</small>
                                                    )}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </DragDropContext>
        </div>
    );
};

export default KanbanBoard;