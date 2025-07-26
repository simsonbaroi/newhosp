import React, { useState, useEffect } from 'react';

interface CupertinoDateTimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  initialDate?: Date;
  title?: string;
}

export const CupertinoDateTimePicker: React.FC<CupertinoDateTimePickerProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialDate = new Date(),
  title = "Select Date & Time"
}) => {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [showDatePicker, setShowDatePicker] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Days of the week
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Months
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Time options
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i < 10 ? `0${i}` : `${i}`);
  const periods = ['AM', 'PM'];
  
  // Generate date options for the next 7 days
  const generateDateOptions = () => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      return {
        date,
        day: days[date.getDay()],
        month: months[date.getMonth()],
        dateNum: date.getDate(),
        year: date.getFullYear(),
        isToday: i === 0
      };
    });
  };
  
  const dateOptions = generateDateOptions();
  
  // Time slots
  const timeSlots = [
    { hour: 6, minute: 0, period: 'AM' },
    { hour: 8, minute: 0, period: 'AM' },
    { hour: 10, minute: 0, period: 'AM' },
    { hour: 12, minute: 0, period: 'PM' },
    { hour: 2, minute: 0, period: 'PM' },
    { hour: 4, minute: 0, period: 'PM' },
    { hour: 6, minute: 0, period: 'PM' },
    { hour: 8, minute: 0, period: 'PM' }
  ];
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
    setShowTimePicker(true);
  };
  
  const handleTimeSelect = (time: { hour: number; minute: number; period: string }) => {
    const newDate = new Date(selectedDate);
    const hour24 = time.period === 'PM' && time.hour !== 12 ? time.hour + 12 : 
                   time.period === 'AM' && time.hour === 12 ? 0 : time.hour;
    newDate.setHours(hour24);
    newDate.setMinutes(time.minute);
    setSelectedDate(newDate);
    setShowTimePicker(false);
  };
  
  const handleCancel = () => {
    setShowDatePicker(true);
    setShowTimePicker(false);
    onClose();
  };
  
  const handleConfirm = () => {
    onConfirm(selectedDate);
    setShowDatePicker(true);
    setShowTimePicker(false);
    onClose();
  };
  
  const formatDate = (date: Date) => {
    return `${days[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDate(initialDate);
      setShowDatePicker(true);
      setShowTimePicker(false);
    }
  }, [isOpen, initialDate]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="cupertino-picker bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-md">
        <div className="picker-header p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
          <div className="selected-date text-blue-600 font-medium">
            {formatDate(selectedDate)} at {selectedDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </div>
        </div>
        
        {showDatePicker && (
          <div className="date-picker p-4">
            <div className="date-options space-y-2">
              {dateOptions.map((option, index) => (
                <div 
                  key={index} 
                  className={`date-option flex justify-between items-center p-4 rounded-lg cursor-pointer transition-all border ${
                    selectedDate.getDate() === option.dateNum && selectedDate.getMonth() === option.date.getMonth() 
                      ? 'bg-blue-50 border-blue-500' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleDateSelect(option.date)}
                >
                  <div className="date-info flex items-center gap-3">
                    <span className="day font-medium w-8">{option.day}</span>
                    <span className="month text-gray-500 w-8">{option.month}</span>
                    <span className="date-num text-xl font-medium w-7">{option.dateNum}</span>
                  </div>
                  <div className="year text-gray-500">{option.year}</div>
                  {option.isToday && (
                    <div className="today-label absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Today
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {showTimePicker && (
          <div className="time-picker p-4 space-y-5">
            <div className="time-slots grid grid-cols-2 gap-2">
              {timeSlots.map((time, index) => (
                <div 
                  key={index} 
                  className="time-slot p-3 border border-gray-200 rounded-lg cursor-pointer transition-all text-center hover:bg-gray-50"
                  onClick={() => handleTimeSelect(time)}
                >
                  <div className="time-display flex justify-center gap-1 text-lg font-medium">
                    <span className="hour">{time.hour}</span>
                    <span>:</span>
                    <span className="minute">{time.minute < 10 ? `0${time.minute}` : time.minute}</span>
                    <span className="period ml-1">{time.period}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="time-wheel flex justify-center gap-5 h-48 overflow-hidden relative rounded-lg bg-gray-50 py-5">
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none"></div>
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none"></div>
              
              <div className="wheel-column flex flex-col items-center overflow-y-auto scroll-smooth w-16 py-16 scrollbar-hide">
                {hours.map((hour) => (
                  <div 
                    key={hour} 
                    className={`wheel-item h-10 flex items-center justify-center w-full text-xl ${
                      selectedDate.getHours() % 12 === (hour % 12) || (selectedDate.getHours() === 0 && hour === 12)
                        ? 'text-blue-600 font-semibold text-2xl' 
                        : 'text-gray-400'
                    }`}
                  >
                    {hour}
                  </div>
                ))}
              </div>
              
              <div className="wheel-column flex flex-col items-center overflow-y-auto scroll-smooth w-16 py-16 scrollbar-hide">
                {minutes.map((minute) => (
                  <div 
                    key={minute} 
                    className={`wheel-item h-10 flex items-center justify-center w-full text-xl ${
                      selectedDate.getMinutes() === parseInt(minute) 
                        ? 'text-blue-600 font-semibold text-2xl' 
                        : 'text-gray-400'
                    }`}
                  >
                    {minute}
                  </div>
                ))}
              </div>
              
              <div className="wheel-column flex flex-col items-center overflow-y-auto scroll-smooth w-16 py-16 scrollbar-hide">
                {periods.map((period) => (
                  <div 
                    key={period} 
                    className={`wheel-item h-10 flex items-center justify-center w-full text-xl ${
                      (selectedDate.getHours() >= 12 ? 'PM' : 'AM') === period
                        ? 'text-blue-600 font-semibold text-2xl' 
                        : 'text-gray-400'
                    }`}
                  >
                    {period}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div className="picker-footer flex p-4 border-t border-gray-200 gap-3">
          <button 
            className="cancel-btn flex-1 py-3 rounded-lg border-none text-lg font-medium cursor-pointer transition-all bg-transparent text-blue-600 hover:bg-gray-50"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button 
            className="confirm-btn flex-1 py-3 rounded-lg border-none text-lg font-medium cursor-pointer transition-all bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleConfirm}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};