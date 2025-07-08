const reducer = (state, action) => {
  switch (action.type) {
    case 'START_LOADING':
      return { ...state, loading: true };
    case 'END_LOADING':
      return { ...state, loading: false };
    case 'UPDATE_ALERT':
      return { ...state, alert: action.payload };
    case 'UPDATE_PROFILE':
      return { ...state, profile: action.payload };
    case 'UPDATE_USER':
      return { ...state, currentUser: action.payload };
    case 'UPDATE_IMAGES':
      return { ...state, images: [...state.images, ...action.payload] };
    case 'DELETE_IMAGE':
      return {
        ...state,
        images: state.images.filter((image) => image !== action.payload),
      };
    case 'UPDATE_DETAILS':
      return { ...state, details: { ...state.details, ...action.payload } };
    case 'UPDATE_LOCATION':
      return { ...state, location: action.payload };
    case 'UPDATE_UPDATED_CHANTIER':
      return { ...state, updatedChantier: action.payload };
    case 'RESET_CHANTIER':
      return {
        ...state,
        images: [],
        details: { title: '', description: '', price: 0 },
        location: { lng: 0, lat: 0 },
        updatedChantier: null,
        deletedImages: [],
        addedImages: []
      };
    case 'UPDATE_CHANTIERS':
  return {
    ...state,
    chantiers: action.payload,
    addressFilter: null,
    priceFilter: 100,
    filteredChantiers: action.payload,
  };
    case 'CLEAR_ADDRESS':
      return {
        ...state,
        addressFilter: null,
        priceFilter: 100,
        filteredChantiers: state.chantiers,
      };
    case 'UPDATE_CHANTIER':
      return { ...state, chantier: action.payload };
    case 'UPDATE_USERS':
      return { ...state, users: action.payload };
    case 'DELETE_CHANTIER':
      return { ...state, chantiers: state.chantiers.filter(chantier => chantier._id !== action.payload) };
    case 'UPDATE_SECTION':
      return { ...state, section: action.payload };
    case 'UPDATE_DELETED_IMAGES':
      return { ...state, deletedImages: [...state.deletedImages, ...action.payload] };
    case 'UPDATE_ADDED_IMAGES':
      return { ...state, addedImages: [...state.addedImages, ...action.payload] };
    case 'UPDATE_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'UPDATE_MESSAGES':
      return { ...state, messages: action.payload };
    case 'OPEN_MESSAGE':
      return { ...state, openMessage: true };
    default:
      throw new Error('No matched action!');
  }
};

export default reducer;
