import { maskFields } from '../src/mask/field-masker';

describe('maskFields', () => {
  it('masks nested fields and array item fields without mutating the input', () => {
    const input = {
      password: 'secret',
      profile: { ssn: '123', name: 'Ada' },
      cards: [{ cardNumber: '4111', brand: 'visa' }],
    };

    expect(maskFields(input, ['password', 'profile.ssn', 'cards.cardNumber'])).toEqual({
      password: '[MASKED]',
      profile: { ssn: '[MASKED]', name: 'Ada' },
      cards: [{ cardNumber: '[MASKED]', brand: 'visa' }],
    });
    expect(input.profile.ssn).toBe('123');
  });
});
