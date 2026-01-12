// Service d'autocomplétion d'adresses via api-adresse.data.gouv.fr

export interface AddressSuggestion {
  id: string;
  label: string;
  city: string;
  postcode: string;
  street: string;
  housenumber: string;
  latitude: number;
  longitude: number;
}

export interface AddressSearchResult {
  suggestions: AddressSuggestion[];
  error?: string;
}

const API_BASE_URL = 'https://api-adresse.data.gouv.fr';

export const addressService = {
  // Rechercher des adresses
  async search(query: string, limit: number = 5): Promise<AddressSearchResult> {
    if (!query || query.length < 3) {
      return { suggestions: [] };
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/search/?q=${encodeURIComponent(query)}&limit=${limit}&autocomplete=1`
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la recherche');
      }

      const data = await response.json();

      const suggestions: AddressSuggestion[] = data.features.map((feature: any) => ({
        id: feature.properties.id,
        label: feature.properties.label,
        city: feature.properties.city || '',
        postcode: feature.properties.postcode || '',
        street: feature.properties.street || '',
        housenumber: feature.properties.housenumber || '',
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
      }));

      return { suggestions };
    } catch (error) {
      console.error('Address search error:', error);
      return { suggestions: [], error: 'Erreur lors de la recherche' };
    }
  },

  // Rechercher par coordonnées (reverse geocoding)
  async reverse(latitude: number, longitude: number): Promise<AddressSuggestion | null> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/reverse/?lat=${latitude}&lon=${longitude}`
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la recherche inverse');
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        return {
          id: feature.properties.id,
          label: feature.properties.label,
          city: feature.properties.city || '',
          postcode: feature.properties.postcode || '',
          street: feature.properties.street || '',
          housenumber: feature.properties.housenumber || '',
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0],
        };
      }

      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  },
};

export default addressService;
