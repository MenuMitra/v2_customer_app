import BaseModal from '../BaseModal';
import { useOutlet } from '../../../contexts/OutletContext';
import { useModal } from '../../../contexts/ModalContext';

export const OrderTypeModal = () => {
  const { closeModal, modals } = useModal();
  const { updateOrderSettings, orderSettings } = useOutlet();

  const orderTypes = [
    {
      id: 'counter',
      title: 'Counter',
      icon: '🏪'
    },
    {
      id: 'drive-through',
      title: 'Drive Through',
      icon: '🚗'
    },
    {
      id: 'delivery',
      title: 'Delivery',
      icon: '🛵'
    },
    {
      id: 'parcel',
      title: 'Parcel',
      icon: '📦'
    }
  ];

  const handleOrderTypeSelect = (type) => {
    updateOrderSettings({ order_type: type });
    closeModal('orderType');
  };

  return (
    <BaseModal 
      isOpen={modals.orderType}
      title="Select Order Type" 
      onClose={() => closeModal('orderType')}
      size="modal-dialog-centered"
    >
      <div className="p-3">
        <div className="grid grid-cols-2 gap-3">
          {orderTypes.map((type) => {
            const isSelected = orderSettings.order_type === type.id;
            return (
              <button 
                key={type.id}
                className={`
                  w-full h-full py-3 px-4 flex flex-col items-center justify-center
                  rounded-xl min-h-[100px] transition-all duration-300 ease-in-out
                  ${isSelected 
                    ? 'bg-primary text-white border-2 border-primary' 
                    : 'bg-white text-primary border-2 border-primary hover:bg-primary/10'
                  }
                `}
                onClick={() => handleOrderTypeSelect(type.id)}
              >
                <span className="mb-2 text-2xl">{type.icon}</span>
                <span className="text-sm font-medium">{type.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </BaseModal>
  );
};
