function validateLoginForm({ email, password }) {
  const errors = {}

  if (!email.trim()) {
    errors.email = 'Email is required.'
  }

  if (!password) {
    errors.password = 'Password is required.'
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }

  return errors
}

function validateRegisterForm({ email, name, password }) {
  const errors = {}

  if (!name.trim()) {
    errors.name = 'Name is required.'
  } else if (name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.'
  }

  if (!email.trim()) {
    errors.email = 'Email is required.'
  }

  if (!password) {
    errors.password = 'Password is required.'
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }

  return errors
}

function validateExpenseForm({ amount, category }) {
  const errors = {}

  if (!amount) {
    errors.amount = 'Amount is required.'
  } else if (Number(amount) <= 0) {
    errors.amount = 'Amount must be greater than zero.'
  }

  if (!category.trim()) {
    errors.category = 'Category is required.'
  }

  return errors
}

export { validateExpenseForm, validateLoginForm, validateRegisterForm }
