import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTrash, FaEye, FaDownload, FaCalendarAlt, FaSearch } from 'react-icons/fa';
import { 
  getHistory, 
  deleteAnalysis, 
  clearHistory, 
  formatDate, 
  exportAnalysisToJson 
} from '../services/storageService';

const HistoryContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  
  @media (min-width: 576px) {
    gap: 1.25rem;
    padding: 1.25rem;
  }
  
  @media (min-width: 768px) {
    gap: 1.5rem;
    padding: 1.5rem;
  }
`;

const HistoryHeader = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 1rem;
  
  @media (min-width: 576px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
  }
`;

const Title = styled.h2`
  margin: 0;
  color: #333;
  font-size: 1.5rem;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  width: 100%;
  border: 1px solid #e9ecef;
  
  @media (min-width: 576px) {
    max-width: 300px;
  }
`;

const SearchInput = styled.input`
  border: none;
  background: transparent;
  padding: 0.5rem;
  flex-grow: 1;
  font-size: 0.9rem;
  outline: none;
  color: #495057;

  &::placeholder {
    color: #adb5bd;
  }
`;

const SearchIcon = styled(FaSearch)`
  color: #6c757d;
  margin-right: 0.5rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #6c757d;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #dee2e6;
`;

const EmptyStateText = styled.p`
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
`;

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const HistoryItem = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  @media (min-width: 576px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
  }
`;

const ItemInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const FoodName = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  color: #333;
`;

const CalorieInfo = styled.div`
  font-size: 0.9rem;
  color: #6c757d;
`;

const DateInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #6c757d;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  justify-content: flex-end;
  width: 100%;
  
  @media (min-width: 576px) {
    margin-top: 0;
    width: auto;
  }
`;

const Button = styled.button.attrs(props => ({
  // Convert boolean props to string attributes
  primary: props.primary ? 'true' : undefined,
  danger: props.danger ? 'true' : undefined,
  small: props.small ? 'true' : undefined
}))`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.small === 'true' ? '0.25rem' : '0.5rem'};
  padding: ${props => props.small === 'true' ? '0.5rem' : '0.75rem 1rem'};
  border: none;
  border-radius: 8px;
  background: ${props => props.primary === 'true' ? '#007bff' : props.danger === 'true' ? '#dc3545' : '#6c757d'};
  color: white;
  font-size: ${props => props.small === 'true' ? '0.8rem' : '0.9rem'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.primary === 'true' ? '#0056b3' : props.danger === 'true' ? '#c82333' : '#545b62'};
    transform: translateY(-1px);
  }

  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
    transform: none;
  }
`;

const IconButton = styled.button.attrs(props => ({
  // Convert boolean props to string attributes
  primary: props.primary ? 'true' : undefined,
  danger: props.danger ? 'true' : undefined
}))`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: ${props => props.danger === 'true' ? '#f8d7da' : props.primary === 'true' ? '#cce5ff' : '#e9ecef'};
  color: ${props => props.danger === 'true' ? '#dc3545' : props.primary === 'true' ? '#007bff' : '#6c757d'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.danger === 'true' ? '#f5c6cb' : props.primary === 'true' ? '#b8daff' : '#dee2e6'};
    transform: translateY(-1px);
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const PageButton = styled.button.attrs(props => ({
  // Convert boolean props to string attributes
  active: props.active ? 'true' : undefined
}))`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: ${props => props.active === 'true' ? '#007bff' : 'white'};
  color: ${props => props.active === 'true' ? 'white' : '#6c757d'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.active === 'true' ? '#007bff' : '#f8f9fa'};
  }

  &:disabled {
    background: #e9ecef;
    cursor: not-allowed;
  }
`;

const ConfirmDialog = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const DialogContent = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const DialogTitle = styled.h3`
  margin-top: 0;
  color: #333;
`;

const DialogButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
`;

const DetailView = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 0.5rem;
  
  @media (min-width: 576px) {
    padding: 1rem;
  }
`;

const DetailContent = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1rem;
  width: 95%;
  max-width: 500px;
  max-height: 95vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  
  @media (min-width: 576px) {
    padding: 1.5rem;
    width: 90%;
    max-height: 90vh;
  }
`;

const DetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const DetailTitle = styled.h3`
  margin: 0;
  color: #333;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  
  &:hover {
    color: #343a40;
  }
`;

const MacroInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin: 1rem 0;
`;

const MacroItem = styled.div`
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
  border-top: 3px solid ${props => props.color};
`;

const MacroValue = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
`;

const MacroLabel = styled.div`
  font-size: 0.8rem;
  color: #6c757d;
  margin-top: 0.25rem;
`;

const ITEMS_PER_PAGE = 5;

const HistoryView = ({ onSelectAnalysis }) => {
  const [historyItems, setHistoryItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // Load history on component mount
  useEffect(() => {
    loadHistory();
  }, []);

  // Filter items when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredItems(historyItems);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = historyItems.filter(item => {
        // Search in food name
        if (item.foodName && item.foodName.toLowerCase().includes(term)) {
          return true;
        }
        
        // Search in detected foods if available
        if (item.detectedFoods && Array.isArray(item.detectedFoods)) {
          return item.detectedFoods.some(food => 
            food.name && food.name.toLowerCase().includes(term)
          );
        }
        
        return false;
      });
      setFilteredItems(filtered);
    }
    
    // Reset to first page when filtering
    setCurrentPage(1);
  }, [searchTerm, historyItems]);

  const loadHistory = () => {
    const history = getHistory();
    setHistoryItems(history);
    setFilteredItems(history);
  };

  const handleDeleteItem = (id) => {
    setConfirmDelete(id);
  };

  const confirmDeleteItem = () => {
    if (confirmDelete) {
      deleteAnalysis(confirmDelete);
      loadHistory();
      setConfirmDelete(null);
    }
  };

  const handleClearHistory = () => {
    setConfirmClear(true);
  };

  const confirmClearHistory = () => {
    clearHistory();
    loadHistory();
    setConfirmClear(false);
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
  };

  const handleSelectForAnalysis = (item) => {
    if (onSelectAnalysis) {
      onSelectAnalysis(item);
    }
    setSelectedItem(null);
  };

  const handleExportAnalysis = (item) => {
    try {
      const dataUri = exportAnalysisToJson(item);
      
      // Create a download link
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = `analisis-${item.id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al exportar análisis:', error);
      alert('No se pudo exportar el análisis');
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <HistoryContainer>
      <HistoryHeader>
        <Title>Historial de Análisis</Title>
        <SearchContainer>
          <SearchIcon />
          <SearchInput
            type="text"
            placeholder="Buscar por alimento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchContainer>
      </HistoryHeader>

      {historyItems.length === 0 ? (
        <EmptyState>
          <EmptyStateText>No hay análisis guardados en el historial.</EmptyStateText>
          <Button primary>Analizar una imagen</Button>
        </EmptyState>
      ) : (
        <>
          <HistoryList>
            {paginatedItems.map(item => (
              <HistoryItem key={item.id}>
                <ItemInfo>
                  <FoodName>{item.foodName || 'Alimento sin nombre'}</FoodName>
                  <CalorieInfo>{Math.round(item.calories || 0)} calorías</CalorieInfo>
                  <DateInfo>
                    <FaCalendarAlt />
                    {formatDate(item.date)}
                  </DateInfo>
                </ItemInfo>
                <ActionButtons>
                  <IconButton primary onClick={() => handleViewDetails(item)}>
                    <FaEye />
                  </IconButton>
                  <IconButton onClick={() => handleExportAnalysis(item)}>
                    <FaDownload />
                  </IconButton>
                  <IconButton danger onClick={() => handleDeleteItem(item.id)}>
                    <FaTrash />
                  </IconButton>
                </ActionButtons>
              </HistoryItem>
            ))}
          </HistoryList>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination>
              <PageButton 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                &lt;
              </PageButton>
              
              {[...Array(totalPages)].map((_, index) => (
                <PageButton
                  key={index}
                  active={currentPage === index + 1}
                  onClick={() => setCurrentPage(index + 1)}
                >
                  {index + 1}
                </PageButton>
              ))}
              
              <PageButton
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              >
                &gt;
              </PageButton>
            </Pagination>
          )}

          {/* Clear History Button */}
          <Button danger onClick={handleClearHistory}>
            <FaTrash />
            Limpiar Historial
          </Button>
        </>
      )}

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <ConfirmDialog>
          <DialogContent>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <p>¿Estás seguro de que deseas eliminar este análisis del historial?</p>
            <DialogButtons>
              <Button onClick={() => setConfirmDelete(null)}>Cancelar</Button>
              <Button danger onClick={confirmDeleteItem}>Eliminar</Button>
            </DialogButtons>
          </DialogContent>
        </ConfirmDialog>
      )}

      {/* Confirm Clear All Dialog */}
      {confirmClear && (
        <ConfirmDialog>
          <DialogContent>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <p>¿Estás seguro de que deseas eliminar todo el historial? Esta acción no se puede deshacer.</p>
            <DialogButtons>
              <Button onClick={() => setConfirmClear(false)}>Cancelar</Button>
              <Button danger onClick={confirmClearHistory}>Eliminar Todo</Button>
            </DialogButtons>
          </DialogContent>
        </ConfirmDialog>
      )}

      {/* Detail View */}
      {selectedItem && (
        <DetailView>
          <DetailContent>
            <DetailHeader>
              <DetailTitle>{selectedItem.foodName || 'Detalles del análisis'}</DetailTitle>
              <CloseButton onClick={() => setSelectedItem(null)}>&times;</CloseButton>
            </DetailHeader>
            
            <DateInfo>
              <FaCalendarAlt />
              {formatDate(selectedItem.date)}
            </DateInfo>
            
            <h4>Información Nutricional</h4>
            <div style={{ textAlign: 'center', margin: '1rem 0' }}>
              <h2 style={{ color: '#007bff', margin: '0' }}>
                {Math.round(selectedItem.calories || 0)}
              </h2>
              <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Calorías totales</div>
            </div>
            
            <MacroInfo>
              <MacroItem color="#FF6384">
                <MacroValue>{selectedItem.protein || 0}g</MacroValue>
                <MacroLabel>Proteínas</MacroLabel>
              </MacroItem>
              <MacroItem color="#36A2EB">
                <MacroValue>{selectedItem.carbs || 0}g</MacroValue>
                <MacroLabel>Carbohidratos</MacroLabel>
              </MacroItem>
              <MacroItem color="#FFCE56">
                <MacroValue>{selectedItem.fat || 0}g</MacroValue>
                <MacroLabel>Grasas</MacroLabel>
              </MacroItem>
            </MacroInfo>
            
            {selectedItem.detectedFoods && selectedItem.detectedFoods.length > 0 && (
              <>
                <h4>Alimentos Detectados</h4>
                <ul style={{ paddingLeft: '1.5rem' }}>
                  {selectedItem.detectedFoods.map((food, index) => (
                    <li key={index}>
                      {food.name} - {food.calories} cal
                      {food.weight && ` (${food.weight}g)`}
                    </li>
                  ))}
                </ul>
              </>
            )}
            
            <DialogButtons>
              <Button onClick={() => setSelectedItem(null)}>Cerrar</Button>
              <Button primary onClick={() => handleSelectForAnalysis(selectedItem)}>
                Usar para Comparación
              </Button>
            </DialogButtons>
          </DetailContent>
        </DetailView>
      )}
    </HistoryContainer>
  );
};

export default HistoryView;