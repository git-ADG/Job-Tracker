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

    // --- Modal State ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeApp, setActiveApp] = useState(null);
    const [noteText, setNoteText] = useState("");

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
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            setApplications(previousApplications);
            alert("Network error: Failed to save application status. The card has been reverted.");
        }
    };

    // --- Note Handlers ---
    const openNoteModal = (app) => {
        setActiveApp(app);
        setNoteText(app.notes || ""); // Load existing notes or empty string
        setIsModalOpen(true);
    };

    const closeNoteModal = () => {
        setIsModalOpen(false);
        setActiveApp(null);
        setNoteText("");
    };

    const handleSaveNote = async () => {
        if (!activeApp) return;

        try {
            // Optimistic UI update in the main applications array
            const updatedApplications = applications.map(app => 
                app._id === activeApp._id ? { ...app, notes: noteText } : app
            );
            setApplications(updatedApplications);
            closeNoteModal();

            // Send to backend
            await axios.put(`${API_URI}/api/applications/${activeApp._id}/notes`, {
                notes: noteText
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Failed to save note:", error);
            alert("Failed to save note. Please try again.");
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <div className='kanban-scroll-container' style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
                <DragDropContext onDragEnd={onDragEnd}>
                    {COLUMNS.map((columnId) => (
                        <div 
                            key={columnId} 
                            style={{ 
                                flex: 1, 
                                minWidth: '180px', 
                                backgroundColor: 
                                    columnId === 'Offer' ? '#d4edda' :        
                                    columnId === 'Accepted' ? '#2ecc71' :     
                                    columnId === 'Rejected' ? '#f8d7da' :     
                                    '#fff3cd',                                
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
                                                        
                                                        {/* Action Buttons */}
                                                        <div style={{ display: 'flex', gap: '5px' }}>
                                                            <button 
                                                                onClick={() => openNoteModal(app)}
                                                                style={{
                                                                    flex: 1, padding: '5px', backgroundColor: '#f0f0f0', color: '#333',
                                                                    border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
                                                                }}
                                                            >
                                                                {app.notes ? '📝 Edit Note' : '➕ Add Note'}
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDelete(app._id)}
                                                                style={{
                                                                    flex: 1, padding: '5px', backgroundColor: '#dc3545', color: 'white',
                                                                    border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                                                                }}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
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

            {/* --- Notes Modal Overlay --- */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white', padding: '20px', borderRadius: '8px',
                        width: '90%', maxWidth: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ marginTop: 0 }}>Notes for {activeApp?.companyName}</h3>
                        <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>Role: {activeApp?.role}</p>
                        
                        <textarea 
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Add interview details, recruiter email, or preparation notes here..."
                            style={{
                                width: '100%', height: '150px', padding: '10px',
                                borderRadius: '4px', border: '1px solid #ccc',
                                resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit'
                            }}
                        />
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
                            <button 
                                onClick={closeNoteModal}
                                style={{ padding: '8px 15px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'white' }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveNote}
                                style={{ padding: '8px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', fontWeight: 'bold' }}
                            >
                                Save Note
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KanbanBoard;