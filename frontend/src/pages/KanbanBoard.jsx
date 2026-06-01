import { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const API_URI = import.meta.env.VITE_API_URL;
const COLUMNS = ['Applied', 'OA', 'Interview', 'Offer', 'Rejected', 'Accepted'];

const KanbanBoard = ({ applications, setApplications, handleDelete }) => {
    const token = localStorage.getItem('token');

    const [boardData, setBoardData] = useState({
        'Applied': [], 'OA': [], 'Interview': [], 'Offer': [], 'Rejected': [], 'Accepted': []
    });

    useEffect(() => {
        const groupedData = {
            'Applied': [], 'OA': [], 'Interview': [], 'Offer': [], 'Rejected': [], 'Accepted': []
        };
        applications.forEach(app => {
            if (groupedData[app.status]) {
                groupedData[app.status].push(app);
            }
        });
        setBoardData(groupedData);
    }, [applications]);

    const onDragEnd = async (result) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const previousApplications = [...applications];
        const updatedApplications = applications.map(app => 
            app._id === draggableId ? { ...app, status: destination.droppableId } : app
        );
        
        setApplications(updatedApplications);

        try {
            await axios.put(`${API_URI}/api/applications/${draggableId}/status`, {
                status: destination.droppableId
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
        } catch (error) {
            setApplications(previousApplications);
            alert("Network error: Failed to save application status. The card has been reverted.");
        }
    };

    return (
        <div className='kanban-scroll-container' style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
            <DragDropContext onDragEnd={onDragEnd}>
                {COLUMNS.map((columnId) => (
                    <div 
                        key={columnId} 
                        style={{ 
                            flex: 1, 
                            minWidth: '180px', 
                            backgroundColor: 
                                columnId === 'Offer' ? '#d4edda' :        // Light Green
                                columnId === 'Accepted' ? '#2ecc71' :     // Darker, Brighter Green
                                columnId === 'Rejected' ? '#f8d7da' :     // Light Red
                                '#fff3cd',                                // Yellow for others
                            padding: '10px', 
                            borderRadius: '8px' 
                        }}
                    >
                        <h3 style={{ textTransform: 'uppercase', marginBottom: '15px', color: '#5e6c84', fontSize: '14px', textAlign: 'center' }}>
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
                                                        padding: '12px',
                                                        margin: '0 0 10px 0',
                                                        backgroundColor: snapshot.isDragging ? '#e6fcff' : '#ffffff',
                                                        borderRadius: '4px',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                                                        ...provided.draggableProps.style
                                                    }}
                                                >
                                                    <h4 style={{ margin: '0 0 5px 0', fontSize: '15px' }}>{app.companyName}</h4>
                                                    <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '13px' }}>{app.role}</p>
                                                    
                                                    <button 
                                                        onClick={() => handleDelete(app._id)}
                                                        style={{
                                                            width: '100%', padding: '5px', backgroundColor: '#dc3545', color: 'white',
                                                            border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
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