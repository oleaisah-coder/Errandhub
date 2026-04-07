window.addEventListener('DOMContentLoaded', () => {
  const onboardingBtn = document.getElementById('onboarding-btn');
  if (onboardingBtn) {
    onboardingBtn.onclick = () => console.log('Onboarding action triggered safely.');
  }

  const nextBtn = document.getElementById('next-step-btn');
  if (nextBtn) {
    nextBtn.onclick = () => console.log('Next step triggered safely.');
  }

  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) {
    submitBtn.onclick = () => console.log('Submit triggered safely.');
  }
});
