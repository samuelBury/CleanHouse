import React, {useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import {FontAwesome5} from '@expo/vector-icons';
import {Colors} from '../config/theme';
import {addressService, AddressSuggestion} from '../services/addressService';

interface AddressAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectAddress: (address: AddressSuggestion) => void;
  placeholder?: string;
  style?: any;
}

export default function AddressAutocomplete({
  value,
  onChangeText,
  onSelectAddress,
  placeholder = 'Rechercher une adresse...',
  style,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const searchAddress = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    const result = await addressService.search(query, 5);
    setSuggestions(result.suggestions);
    setShowSuggestions(result.suggestions.length > 0);
    setIsLoading(false);
  }, []);

  const handleTextChange = (text: string) => {
    onChangeText(text);

    // Debounce la recherche
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchAddress(text);
    }, 300);
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    const fullAddress = suggestion.label ||
      `${suggestion.housenumber || ''} ${suggestion.street || ''}, ${suggestion.postcode || ''} ${suggestion.city || ''}`.trim();
    onChangeText(fullAddress);
    onSelectAddress(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Délai pour permettre le clic sur une suggestion
    setTimeout(() => {
      setShowSuggestions(false);
    }, 300);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {isLoading && (
          <ActivityIndicator
            size="small"
            color={Colors.primary}
            style={styles.loader}
          />
        )}
        {value.length > 0 && !isLoading && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              onChangeText('');
              setSuggestions([]);
              setShowSuggestions(false);
            }}
          >
            <FontAwesome5 name="times" size={12} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={suggestion.id || index}
              style={[
                styles.suggestionItem,
                index === suggestions.length - 1 && styles.suggestionItemLast,
              ]}
              onPress={() => handleSelectSuggestion(suggestion)}
              activeOpacity={0.7}
            >
              <View style={styles.suggestionIcon}>
                <FontAwesome5 name="map-marker-alt" size={16} color={Colors.primary} />
              </View>
              <View style={styles.suggestionContent}>
                <Text style={styles.suggestionLabel} numberOfLines={1}>
                  {suggestion.housenumber} {suggestion.street}
                </Text>
                <Text style={styles.suggestionCity} numberOfLines={1}>
                  {suggestion.postcode} {suggestion.city}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 999,
    overflow: 'visible',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 15,
    color: Colors.text.primary,
  },
  loader: {
    marginRight: 12,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.text.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  clearButtonText: {
    color: '#fff',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: Colors.border.light,
    maxHeight: 250,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  suggestionIconText: {
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  suggestionCity: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
});
