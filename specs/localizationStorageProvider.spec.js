'use strict';

let LOCALIZATION_EN = {yes: 'Yes'};
let LOCALIZATION_DE = {yes: 'Ja'};
let LOCALIZATION_SV = {yes: 'Ja'};
let LOCALIZATION_FR = {yes: 'Oui'};

describe('LocalizationStorage service', () => {
  let LocalizationStorage;
  let $rootScope;

  beforeEach(angular.mock.module('localization.storage'));

  beforeEach(angular.mock.inject(($injector) => {
    $rootScope = $injector.get('$rootScope').$new();
    LocalizationStorage = $injector.get('LocalizationStorage');
  }));

  it('initially has no localizations, but the referenced variables are present', () => {
    let localizations = LocalizationStorage.get();
    expect(LocalizationStorage.list().length).toBe(0);
    expect(localizations.active).toBe(null);
    expect(localizations.activeId).toBe(null);
  });

  it('can add mulitple localizations and the first one is enabled by default', () => {
    LocalizationStorage.add('en', LOCALIZATION_EN);
    LocalizationStorage.add('de', LOCALIZATION_DE);

    let localizations = LocalizationStorage.get();
    expect(LocalizationStorage.list().length).toBe(2);

    // default locale is the one first added
    expect(localizations.active).toEqual(LOCALIZATION_EN);
    expect(localizations.activeId).toBe('en');
  });

  it('can set the active localizaton', () => {
    LocalizationStorage.add('sv', LOCALIZATION_SV);
    LocalizationStorage.add('fr', LOCALIZATION_FR);

    let localizations = LocalizationStorage.get();

    // using set()
    expect(LocalizationStorage.set('sv')).toBe(true);
    expect(localizations.activeId).toBe('sv');
    expect(localizations.active).toEqual(LOCALIZATION_SV);

    // using set() with extended locale format
    expect(LocalizationStorage.set('sv-SE')).toBe(true);
    expect(localizations.activeId).toBe('sv');
    expect(localizations.active).toEqual(LOCALIZATION_SV);

    // same test as before but with a different locale format
    expect(LocalizationStorage.set('sv_SE')).toBe(true);
    expect(localizations.activeId).toBe('sv');
    expect(localizations.active).toEqual(LOCALIZATION_SV);

    // trying set() with a nonexistent localization
    expect(LocalizationStorage.set('nonexistent')).toBe(false);
    expect(localizations.activeId).toBe('sv');
    expect(localizations.active).toEqual(LOCALIZATION_SV);

    // using get() with a specific locale but without assigning it's response again
    LocalizationStorage.get('fr');
    expect(localizations.activeId).toBe('fr');
    expect(localizations.active).toEqual(LOCALIZATION_FR);

    // trying get() with a nonexistent localization
    LocalizationStorage.get('nonexistent');
    expect(localizations.activeId).toBe('fr');
    expect(localizations.active).toEqual(LOCALIZATION_FR);
  });

  it('can set the active localizaton from an array (first found wins)', () => {
    LocalizationStorage.add('sv', LOCALIZATION_SV);
    LocalizationStorage.add('fr', LOCALIZATION_FR);

    let localizations = LocalizationStorage.get();

    // using set()
    expect(LocalizationStorage.set(['sv', 'fr'])).toBe(true);
    expect(localizations.activeId).toBe('sv');
    expect(localizations.active).toEqual(LOCALIZATION_SV);

    // trying set() with a nonexistent localization follwed by a valid one
    expect(LocalizationStorage.set(['nonexistent', 'fr'])).toBe(true);
    expect(localizations.activeId).toBe('fr');
    expect(localizations.active).toEqual(LOCALIZATION_FR);

    // trying to get a nonexistent country specific locale for an existing
    // locale will be queued at the end and any other existing locales would
    // be set first
    LocalizationStorage.get(['fr-FR', 'nonexistent', 'sv']);
    expect(localizations.activeId).toBe('sv');
    expect(localizations.active).toEqual(LOCALIZATION_SV);

    // same test as before but with a different locale format
    LocalizationStorage.get(['fr_FR', 'nonexistent', 'sv']);
    expect(localizations.activeId).toBe('sv');
    expect(localizations.active).toEqual(LOCALIZATION_SV);

    // trying to get only nonexistent country specific locales for a existing
    // locales will queue them at the end
    LocalizationStorage.get(['fr-FR', 'nonexistent', 'sv-SE']);
    expect(localizations.activeId).toBe('fr');
    expect(localizations.active).toEqual(LOCALIZATION_FR);

    // same test as before but with a different locale format
    LocalizationStorage.get(['fr_FR', 'nonexistent', 'sv_SE']);
    expect(localizations.activeId).toBe('fr');
    expect(localizations.active).toEqual(LOCALIZATION_FR);
  });

  it('broadcasts a `LocaleChange` event on the $rootScope', () => {
    LocalizationStorage.add('en', {});
    LocalizationStorage.add('de', {});

    let eventHasFired = false;

    $rootScope.$on('LocaleChange', () => {
      eventHasFired = true;
    });

    LocalizationStorage.set('de');
    expect(eventHasFired).toBe(true);
  });

  it('can set the strict mode', () => {
    let localizations = LocalizationStorage.get();

    // by default strict mode is disabled
    expect(localizations.strictMode).toBe(false);

    // manually enable strict mode
    LocalizationStorage.strict(true);
    expect(localizations.strictMode).toBe(true);

    // manually disable strict mode
    LocalizationStorage.strict(false);
    expect(localizations.strictMode).toBe(false);
  });

});

describe('LocalizationStorage proivider', () => {
  let LocalizationStorageProvider;
  let LocalizationStorage;

  beforeEach(angular.mock.module('localization.storage', (_LocalizationStorageProvider_) => {
    LocalizationStorageProvider = _LocalizationStorageProvider_;
  }));

  beforeEach(angular.mock.inject(($injector) => {
    LocalizationStorage = $injector.get('LocalizationStorage');
  }));

  it('has the same methods as LocalizationStorage', () => {
    expect(LocalizationStorageProvider.add).toBe(LocalizationStorage.add);
    expect(LocalizationStorageProvider.list).toBe(LocalizationStorage.list);
    expect(LocalizationStorageProvider.strict).toBe(LocalizationStorage.strict);
    expect(LocalizationStorageProvider.get).toBe(LocalizationStorage.get);

    // .set() is a special case since it has a $rootScope wrapper in the service
    // and is therefore not identical to the provider
    LocalizationStorageProvider.add('en', LOCALIZATION_EN);
    LocalizationStorageProvider.add('de', LOCALIZATION_DE);

    let localizations = LocalizationStorage.get();

    expect(LocalizationStorageProvider.set('de')).toBe(true);
    expect(localizations.activeId).toBe('de');

    expect(LocalizationStorageProvider.set('nonexistent')).toBe(false);
    expect(localizations.activeId).toBe('de');
  });

});
