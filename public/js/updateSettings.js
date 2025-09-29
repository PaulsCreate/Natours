/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alert';
// Type is either password or data
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updatePassword'
        : '/api/v1/users/updateMe';
    const res = await axios({
      method: 'PATCH',
      url,
      data
    });
    console.log(res.data.status);
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} Data Updated Successfully`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message || 'Something Went Wrong');
  }
};

