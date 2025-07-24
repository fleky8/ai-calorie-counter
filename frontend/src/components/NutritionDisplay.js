import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Doughnut } from 'react-chartjs-2';
import { FaHistory, FaCamera } from 'react-icons/fa';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { saveAnalysis } from '../services/storageService';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const NutritionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 0 auto;
  
  /* Responsive adjustments */
  @media (min-width: 576px) {
    padding: 1.5rem;
  }
`;

const CaloriesSection = styled.div`
  text-align: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
`;

const CaloriesNumber = styled.h1`
  font-size: 3rem;
  font-weight: bold;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const CaloriesLabel = styled.p`
  font-size: 1.2rem;
  margin: 0.5rem 0 0 0;
  opacity: 0.9;
`;

const MacroSection = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  align-items: center;

  @media (min-width: 576px) {
    gap: 1.25rem;
  }
  
  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
`;

const ChartContainer = styled.div`
  position: relative;
  height: 250px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const MacroDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MacroItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid ${props => props.color};
`;

const MacroName = styled.span`
  font-weight: 500;
  color: #333;
`;

const MacroValue = styled.span`
  font-weight: bold;
  color: ${props => props.color};
`;

const DetailsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
  
  @media (min-width: 576px) {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
  }
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.25rem;
  }
`;

const DetailCard = styled.div`
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #e9ecef;
`;

const DetailValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #495057;
  margin-bottom: 0.5rem;
`;

const DetailLabel = styled.div`
  font-size: 0.9rem;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const FoodName = styled.h2`
  text-align: center;
  color: #333;
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: 600;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 1.5rem;
`;

const Button = styled.button.withConfig({
  shouldForwardProp: (prop) => !['primary', 'secondary'].includes(prop)
})`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  background: ${props => props.primary ? '#007bff' : props.secondary ? '#6c757d' : '#28a745'};
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.primary ? '#0056b3' : props.secondary ? '#545b62' : '#218838'};
    transform: translateY(-1px);
  }

  @media (max-width: 400px) {
    flex: 1;
    justify-content: center;
  }
`;

const SuccessMessage = styled.div`
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  border-radius: 8px;
  padding: 0.75rem;
  text-align: center;
  margin-bottom: 1rem;
`;

const NutritionDisplay = ({ nutritionData, onNewAnalysis }) => {
  const navigate = useNavigate();
  
  if (!nutritionData) {
    return null;
  }

  // Guardar análisis en historial cuando se monta el componente
  useEffect(() => {
    if (nutritionData) {
      try {
        saveAnalysis(nutritionData);
      } catch (error) {
        console.error('Error guardando análisis en historial:', error);
      }
    }
  }, [nutritionData]);

  // Funciones para navegación
  const handleNewAnalysis = () => {
    if (onNewAnalysis) {
      onNewAnalysis();
    }
    navigate('/');
  };

  const handleViewHistory = () => {
    navigate('/history');
  };

  // Extraer datos del resultado del análisis
  const extractNutritionData = (data) => {
    // Si viene del backend con estructura de API
    if (data.data && data.data.nutritionData) {
      const nutrition = data.data.nutritionData;
      const foodItems = data.data.foodItems || [];
      const detectedFoods = nutrition.detectedFoods || [];
      
      return {
        foodName: foodItems.length > 0 ? foodItems.map(item => item.name).join(', ') : 'Alimentos detectados',
        calories: nutrition.totalCalories || 0,
        protein: nutrition.macronutrients?.proteins || 0,
        carbs: nutrition.macronutrients?.carbohydrates || 0,
        fat: nutrition.macronutrients?.fats || 0,
        fiber: nutrition.macronutrients?.fiber || 0,
        sugar: nutrition.macronutrients?.sugar || 0,
        sodium: nutrition.macronutrients?.sodium || 0,
        portion: 'Porción estimada',
        confidence: nutrition.summary?.averageConfidence || 0,
        detectedFoods: detectedFoods.map(food => ({
          name: food.name,
          calories: food.calories,
          weight: food.estimatedWeight,
          confidence: food.confidence,
          macros: food.macronutrients
        })),
        rawData: data
      };
    }
    
    // Si viene con estructura directa
    return {
      foodName: data.foodName || 'Alimento detectado',
      calories: data.calories || data.totalCalories || 0,
      protein: data.protein || data.macronutrients?.proteins || 0,
      carbs: data.carbs || data.macronutrients?.carbohydrates || 0,
      fat: data.fat || data.macronutrients?.fats || 0,
      fiber: data.fiber || 0,
      sugar: data.sugar || 0,
      sodium: data.sodium || 0,
      portion: data.portion || 'Porción estimada',
      confidence: data.confidence || 0,
      detectedFoods: data.detectedFoods || [],
      rawData: data
    };
  };

  const {
    foodName,
    calories,
    protein,
    carbs,
    fat,
    fiber,
    sugar,
    sodium,
    portion,
    confidence,
    detectedFoods
  } = extractNutritionData(nutritionData);

  // Prepare chart data
  const chartData = {
    labels: ['Proteínas', 'Carbohidratos', 'Grasas'],
    datasets: [
      {
        data: [protein, carbs, fat],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56'
        ],
        borderColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56'
        ],
        borderWidth: 2,
        hoverBorderWidth: 3,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: ${value}g`;
          }
        }
      }
    },
    cutout: '60%',
  };

  // Calculate total macros for percentage calculation
  const totalMacros = protein + carbs + fat;

  return (
    <NutritionContainer>
      <SuccessMessage>
        ✅ Análisis completado y guardado en tu historial
      </SuccessMessage>
      
      <FoodName>{foodName}</FoodName>
      
      <CaloriesSection>
        <CaloriesNumber>{Math.round(calories)}</CaloriesNumber>
        <CaloriesLabel>Calorías totales</CaloriesLabel>
        {portion && <CaloriesLabel style={{ fontSize: '1rem', opacity: 0.8 }}>{portion}</CaloriesLabel>}
        {confidence > 0 && (
          <CaloriesLabel style={{ fontSize: '0.9rem', opacity: 0.7 }}>
            Confianza: {Math.round(confidence * 100)}%
          </CaloriesLabel>
        )}
      </CaloriesSection>

      <MacroSection>
        <ChartContainer>
          <Doughnut data={chartData} options={chartOptions} />
        </ChartContainer>
        
        <MacroDetails>
          <MacroItem color="#FF6384">
            <MacroName>Proteínas</MacroName>
            <MacroValue color="#FF6384">
              {Math.round(protein)}g {totalMacros > 0 && `(${Math.round((protein / totalMacros) * 100)}%)`}
            </MacroValue>
          </MacroItem>
          
          <MacroItem color="#36A2EB">
            <MacroName>Carbohidratos</MacroName>
            <MacroValue color="#36A2EB">
              {Math.round(carbs)}g {totalMacros > 0 && `(${Math.round((carbs / totalMacros) * 100)}%)`}
            </MacroValue>
          </MacroItem>
          
          <MacroItem color="#FFCE56">
            <MacroName>Grasas</MacroName>
            <MacroValue color="#FFCE56">
              {Math.round(fat)}g {totalMacros > 0 && `(${Math.round((fat / totalMacros) * 100)}%)`}
            </MacroValue>
          </MacroItem>
        </MacroDetails>
      </MacroSection>

      {(fiber > 0 || sugar > 0 || sodium > 0) && (
        <DetailsSection>
          {fiber > 0 && (
            <DetailCard>
              <DetailValue>{Math.round(fiber)}g</DetailValue>
              <DetailLabel>Fibra</DetailLabel>
            </DetailCard>
          )}
          
          {sugar > 0 && (
            <DetailCard>
              <DetailValue>{Math.round(sugar)}g</DetailValue>
              <DetailLabel>Azúcares</DetailLabel>
            </DetailCard>
          )}
          
          {sodium > 0 && (
            <DetailCard>
              <DetailValue>{Math.round(sodium)}mg</DetailValue>
              <DetailLabel>Sodio</DetailLabel>
            </DetailCard>
          )}
        </DetailsSection>
      )}
      
      {detectedFoods && detectedFoods.length > 0 && (
        <div className="mt-4">
          <h3 className="text-center mb-3">Alimentos Detectados</h3>
          <div className="bg-light p-3 rounded">
            <table className="w-100">
              <thead>
                <tr>
                  <th className="text-left">Alimento</th>
                  <th className="text-right">Calorías</th>
                  <th className="text-right">Peso est.</th>
                </tr>
              </thead>
              <tbody>
                {detectedFoods.map((food, index) => (
                  <tr key={index} className="border-bottom">
                    <td className="py-2">{food.name}</td>
                    <td className="text-right py-2">{Math.round(food.calories)} cal</td>
                    <td className="text-right py-2">{food.weight}g</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-center mt-2 text-muted">
            Nota: Los valores son estimaciones basadas en análisis de IA
          </p>
        </div>
      )}

      <ActionButtons>
        <Button primary onClick={handleNewAnalysis}>
          <FaCamera />
          Nuevo Análisis
        </Button>
        
        <Button secondary onClick={handleViewHistory}>
          <FaHistory />
          Ver Historial
        </Button>
      </ActionButtons>
    </NutritionContainer>
  );
};

export default NutritionDisplay;