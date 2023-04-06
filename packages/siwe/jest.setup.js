jest.mock('ethers', () => {
  const packages = {
    5: 'ethers5',
    6: 'ethers6',
  };
  const version = process.env.ETHERSJS_VERSION || '6';
  console.log('Testing with ethers version', version);

  // Require the original module.
  const originalModule = jest.requireActual(packages[version]);

  return {
    __esModule: true,
    ...originalModule,
  };
});
