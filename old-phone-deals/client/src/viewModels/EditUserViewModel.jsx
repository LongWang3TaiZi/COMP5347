// implements form state management and validation logic for the EditUserForm component
import {useState, useEffect} from 'react';
import {Form} from 'antd';
import SwalService from "../service/SwalService";


const useEditUserViewModel = (user, onSave) => {
    // create form instance using ant design's form hook
    const [form] = Form.useForm();

    // original data for comparison
    const [originalData, setOriginalData] = useState({});

    // flag to track if form has been modified
    const [isModified, setIsModified] = useState(false);

    // state for full name to be synced with firstname and lastname
    const [fullName, setFullName] = useState('');

    // initialize form with user data when user object changes
    useEffect(() => {
        if (user) {
            const firstname = user.firstname || '';
            const lastname = user.lastname || '';
            const fullNameValue = `${firstname} ${lastname}`.trim();

            const userData = {
                firstname: firstname,
                lastname: lastname,
                fullName: fullNameValue,
                email: user.email || '',
                status: user.status || 'active' // set default value
            };

            form.setFieldsValue(userData);
            setOriginalData(userData);
            setFullName(fullNameValue);
            setIsModified(false);
        }
    }, [user, form]);

    // handle values change
    const onValuesChange = (changedValues) => {
        // update fullName if firstname or lastname changes
        if ('firstname' in changedValues || 'lastname' in changedValues) {
            const values = form.getFieldsValue();
            const newFullName = `${values.firstname || ''} ${values.lastname || ''}`.trim();
            setFullName(newFullName);
            form.setFieldValue('fullName', newFullName);
        }

        // get current form values
        const currentValues = form.getFieldsValue();

        // check if any field has been modified (excluding fullName and status which are display-only)
        const hasChanged =
            currentValues.firstname !== originalData.firstname ||
            currentValues.lastname !== originalData.lastname ||
            currentValues.email !== originalData.email;

        setIsModified(hasChanged);
    };

    // handle form submission
    const onFinish = async (values) => {
        // show confirmation dialog
        const result = await SwalService.updateConfirm(
            'Are you sure you want to update this user?',
            'Confirm Update'
        );

        if (result.isConfirmed) {
            // only include modified fields in update (status is display-only)
            const updatedFields = {};
            if (values.firstname !== originalData.firstname) {
                updatedFields.firstname = values.firstname;
            }
            if (values.lastname !== originalData.lastname) {
                updatedFields.lastname = values.lastname;
            }
            if (values.email !== originalData.email) {
                updatedFields.email = values.email;
            }

            onSave(updatedFields);
        }
    };

    return {
        form,
        isModified,
        fullName,
        onValuesChange,
        onFinish
    };
};

export default useEditUserViewModel;