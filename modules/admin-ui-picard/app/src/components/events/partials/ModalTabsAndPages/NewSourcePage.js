import React, {useEffect} from "react";
import {useTranslation} from "react-i18next";
import cn from "classnames";
import Notifications from "../../../shared/Notifications";
import {MuiPickersUtilsProvider, DatePicker} from "@material-ui/pickers";
import {getCurrentLanguageInformation, getTimezoneOffset} from '../../../../utils/utils';
import {createMuiTheme, ThemeProvider} from "@material-ui/core";
import {Field, FieldArray} from "formik";
import RenderField from "../../../shared/wizard/RenderField";
import {getRecordings} from "../../../../selectors/recordingSelectors";
import {fetchRecordings} from "../../../../thunks/recordingThunks";
import {connect} from "react-redux";
import {removeNotificationWizardForm} from "../../../../actions/notificationActions";
import { checkConflicts } from '../../../../thunks/eventThunks';
import {sourceMetadata} from "../../../../configs/sourceConfig";
import {hours, minutes, weekdays} from "../../../../configs/modalConfig";
import {logger} from "../../../../utils/logger";
import DateFnsUtils from '@date-io/date-fns';
import {getUserInformation} from "../../../../selectors/userInfoSelectors";
import {filterDevicesForAccess, hasAnyDeviceAccess} from "../../../../utils/resourceUtils";


// Style to bring date picker pop up to front
const theme = createMuiTheme({
    props: {
        MuiDialog: {
            style: {
                zIndex: '2147483550',
            }
        }
    }
});

/**
 * This component renders the source page for new events in the new event wizard.
 */
const NewSourcePage = ({ previousPage, nextPage, formik, loadingInputDevices, inputDevices, user,
                            removeNotificationWizardForm, checkConflicts }) => {
    const { t } = useTranslation();

    useEffect(() => {
        // Load recordings that can be used for input
        loadingInputDevices();

        // validate form because dependent default values need to be checked
        formik.validateForm().then(r => logger.info(r));
    }, []);

    // Remove old notifications of context event-form
    // Helps to prevent multiple notifications for same problem
    const removeOldNotifications = () => {
        removeNotificationWizardForm();
    }

    const scheduleOptionAvailable = () => {
        return ((inputDevices.length > 0) && (hasAnyDeviceAccess(user, inputDevices)));
    }

    return(
        <>
            <div className="modal-content">
                <div className="modal-body">
                    <div className="full-col">
                        {/*Show notifications with context events-form*/}
                        <Notifications context="not_corner"/>
                        <div className="obj list-obj">
                            <header className="no-expand">{t('EVENTS.EVENTS.NEW.SOURCE.SELECT_SOURCE')}</header>
                            {/* Radio buttons for choosing source mode */}
                            <div className="obj-container">
                                <ul>
                                    {scheduleOptionAvailable() ? (
                                        <li>
                                            <label>
                                                <Field type="radio"
                                                       name="sourceMode"
                                                       className="source-toggle"
                                                       value="UPLOAD"/>
                                                <span>{t('EVENTS.EVENTS.NEW.SOURCE.UPLOAD.CAPTION')}</span>
                                            </label>
                                        </li>
                                    ) : (
                                        <li>
                                            <label>
                                                <span>{t('EVENTS.EVENTS.NEW.SOURCE.UPLOAD.CAPTION')}</span>
                                            </label>
                                        </li>
                                    )}
                                    {scheduleOptionAvailable() && (
                                        <>
                                            <li>
                                                <label>
                                                    <Field type="radio"
                                                           name="sourceMode"
                                                           className="source-toggle"
                                                           value="SCHEDULE_SINGLE"/>
                                                    <span>{t('EVENTS.EVENTS.NEW.SOURCE.SCHEDULE_SINGLE.CAPTION')}</span>
                                                </label>
                                            </li>
                                            <li>
                                                <label>
                                                    <Field type="radio"
                                                           name="sourceMode"
                                                           className="source-toggle"
                                                           value="SCHEDULE_MULTIPLE"/>
                                                    <span>{t('EVENTS.EVENTS.NEW.SOURCE.SCHEDULE_MULTIPLE.CAPTION')}</span>
                                                </label>
                                            </li>
                                        </>
                                    )}

                                </ul>
                            </div>
                        </div>

                        {/* Render rest of page depending on which source mode is chosen */}
                        {formik.values.sourceMode === 'UPLOAD' && (
                            <Upload formik={formik}/>
                        )}
                        {scheduleOptionAvailable() && (formik.values.sourceMode === 'SCHEDULE_SINGLE' ||
                            formik.values.sourceMode === 'SCHEDULE_MULTIPLE') && (
                            <Schedule formik={formik}
                                      inputDevices={filterDevicesForAccess(user, inputDevices)} />
                        )}
                    </div>
                </div>
            </div>

            {/* Button for navigation to next page and previous page */}
            <footer>
                <button type="submit"
                        className={cn("submit",
                            {
                                active: (formik.dirty && formik.isValid),
                                inactive: !(formik.dirty && formik.isValid)
                            })}
                        disabled={!(formik.dirty && formik.isValid)}
                        onClick={async () => {
                            removeOldNotifications();
                            if(await checkConflicts(formik.values)) {
                                nextPage(formik.values);
                            }
                        }}
                        tabIndex="100">{t('WIZARD.NEXT_STEP')}</button>
                <button className="cancel"
                        onClick={() => previousPage(formik.values, false)}
                        tabIndex="101">{t('WIZARD.BACK')}</button>
            </footer>

            <div className="btm-spacer"/>
        </>
    );
};

/*
 * Renders buttons for uploading files and fields for additional metadata
 */
const Upload = ({ formik }) => {
    const { t } = useTranslation();

    const handleChange = (e, assetId) => {
        if (e.target.files.length === 0) {
            formik.setFieldValue(assetId, null);
        } else {
            formik.setFieldValue(assetId, e.target.files);
        }
    }

    return (
        <>
            <div className="obj tbl-details">
                <header>{t('EVENTS.EVENTS.NEW.SOURCE.UPLOAD.RECORDING_ELEMENTS')}</header>
                <div className="obj-container">
                    <table className="main-tbl">
                        <tbody>
                            <FieldArray name="uploadAssetsTrack">
                                {/*File upload button for each upload asset*/}
                                {({insert, remove, push}) => (
                                    formik.values.uploadAssetsTrack.length > 0
                                    && formik.values.uploadAssetsTrack.map((asset, key) => (
                                        <tr key={key}>
                                            <td>
                                                <span style={{fontWeight: "bold"}}>{t(asset.title + ".SHORT", asset['displayOverride.SHORT'])}</span>
                                                <span
                                                    className="ui-helper-hidden">({asset.type} "{asset.flavorType}/{asset.flavorSubType}")</span>
                                                <p>{t(asset.title + ".DETAIL", asset['displayOverride.DETAIL'])}</p>
                                            </td>
                                            <td>
                                                <div className="file-upload">
                                                    <input id={asset.id}
                                                           className="blue-btn file-select-btn"
                                                           accept={asset.accept}
                                                           onChange={e => handleChange(e, `uploadAssetsTrack.${key}.file`)}
                                                           type="file"
                                                           multiple={asset.multiple}
                                                           name={`uploadAssetsTrack.${key}.file`}
                                                           tabIndex=""/>
                                                    {/* Show name of file that is uploaded */}
                                                    {formik.values.uploadAssetsTrack[key].file && (
                                                        <span className="ui-helper">
                                                            {formik.values.uploadAssetsTrack[key].file[0].name.substr(0, 50)}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="fit">
                                                <a className="remove"
                                                   onClick={() => {
                                                       formik.setFieldValue(`uploadAssetsTrack.${key}.file`, null);
                                                   }}/>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </FieldArray>
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="obj list-obj">
                <header className="no-expand">{t('EVENTS.EVENTS.NEW.SOURCE.UPLOAD.RECORDING_METADATA')}</header>
                <div className="obj-container">
                    <table className="main-tbl">
                        <tbody>
                        {/* One row for each metadata field*/}
                        {sourceMetadata.UPLOAD.metadata.map((field, key) => (
                            <tr key={key}>
                                <td>
                                    <span>{t(field.label)}</span>
                                    {field.required && (
                                        <i className="required">*</i>
                                    )}
                                </td>
                                <td className="editable">
                                    <Field name={field.id}
                                           metadataField={field}
                                           component={RenderField}/>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

/*
 * Renders fields for providing information for schedule of event
 */
const Schedule = ({ formik, inputDevices }) => {
    const { t } = useTranslation();

    const currentLanguage = getCurrentLanguageInformation();

    const renderInputDeviceOptions = () => {
        if (!!formik.values.location) {
            let inputDevice = inputDevices.find(({ name }) => name === formik.values.location);
            return (
                inputDevice.inputs.map((input, key) => (
                        <label key={key}>
                            <Field type="checkbox" name="deviceInputs" value={input.id} tabIndex="12"/>
                            {t(input.value)}
                        </label>
                    )
                ));
        }
    }

    return (
        <div className="obj">
            <header>{t('EVENTS.EVENTS.NEW.SOURCE.DATE_TIME.CAPTION')}</header>
            <div className="obj-container">
                <table className="main-tbl">
                    <tbody>
                        <tr>
                            <td>{t('EVENTS.EVENTS.NEW.SOURCE.DATE_TIME.TIMEZONE')}</td>
                            <td>{'UTC' + getTimezoneOffset()}</td>
                        </tr>
                        <tr>
                            <td>{t('EVENTS.EVENTS.NEW.SOURCE.DATE_TIME.START_DATE')} <i className="required">*</i></td>
                            <td>
                                <ThemeProvider theme={theme}>
                                    <MuiPickersUtilsProvider utils={DateFnsUtils} locale={currentLanguage.dateLocale}>
                                        <DatePicker name="scheduleStartDate"
                                                    value={formik.values.scheduleStartDate}
                                                    onChange={value =>
                                                      formik.setFieldValue("scheduleStartDate", value)
                                                    }
                                                    tabIndex="4"/>
                                    </MuiPickersUtilsProvider>
                                </ThemeProvider>
                            </td>
                        </tr>
                        {/* Render fields specific for multiple schedule (Only if this is current source mode)*/}
                        {formik.values.sourceMode === 'SCHEDULE_MULTIPLE' && (
                            <>
                                <tr>
                                    <td>{t('EVENTS.EVENTS.NEW.SOURCE.DATE_TIME.END_DATE')} <i className="required">*</i></td>
                                    <td>
                                        <ThemeProvider theme={theme}>
                                            <DatePicker name="scheduleEndDate"
                                                        value={formik.values.scheduleEndDate}
                                                        onChange={value => formik.setFieldValue("scheduleEndDate", value)}
                                                        tabIndex="4"/>
                                        </ThemeProvider>
                                    </td>
                                </tr>
                                <tr>
                                    <td>{t('EVENTS.EVENTS.NEW.SOURCE.SCHEDULE_MULTIPLE.REPEAT_ON')} <i className="required">*</i>
                                    </td>
                                    <td>
                                        {/* Repeat checkbox for each week day*/}
                                        {weekdays.map((day, key) => (
                                            <div key={key} className="day-check-container">
                                                {t(day.label)}
                                                <br/>
                                                <Field type="checkbox" name="repeatOn" value={day.name}/>
                                            </div>
                                        ))}
                                    </td>
                                </tr>
                            </>
                        )}
                        <tr>
                            <td>{t('EVENTS.EVENTS.NEW.SOURCE.DATE_TIME.START_TIME')} <i className="required">*</i></td>
                            <td>
                                {/* one options for each entry in hours*/}
                                <div className="chosen-container chosen-container-single">
                                    <Field className="chosen-single"
                                           tabIndex="5"
                                           as="select"
                                           name="scheduleStartTimeHour"
                                           placeholder={t('EVENTS.EVENTS.NEW.SOURCE.PLACEHOLDER.HOUR')}>
                                        <option value='' hidden>{t('EVENTS.EVENTS.NEW.SOURCE.PLACEHOLDER.HOUR')}</option>
                                        {hours.map((i, key) => (
                                          <option key={key}
                                                  value={i.value}>
                                              {i.value}
                                          </option>
                                        ))}
                                    </Field>
                                </div>

                                {/* one options for each entry in minutes*/}
                                <div className="chosen-container chosen-container-single">
                                    <Field className="chosen-single"
                                           tabIndex="6"
                                           as="select"
                                           name="scheduleStartTimeMinutes"
                                           placeholder={t('EVENTS.EVENTS.NEW.SOURCE.PLACEHOLDER.MINUTE')}>
                                        <option value='' hidden>{t('EVENTS.EVENTS.NEW.SOURCE.PLACEHOLDER.MINUTE')}</option>
                                        {minutes.map((i, key) => (
                                          <option key={key}
                                                  value={i.value}>
                                              {i.value}
                                          </option>
                                        ))}
                                    </Field>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>{t('EVENTS.EVENTS.NEW.SOURCE.DATE_TIME.DURATION')} <i className="required">*</i></td>
                            <td>
                                {/* one options for each entry in hours*/}
                                <div className="chosen-container chosen-container-single">
                                    <Field className="chosen-single"
                                           tabIndex="7"
                                           as="select"
                                           name="scheduleDurationHour"
                                           placeholder={t('EVENTS.EVENTS.NEW.SOURCE.PLACEHOLDER.HOUR')}>
                                        <option value='' hidden>{t('EVENTS.EVENTS.NEW.SOURCE.PLACEHOLDER.HOUR')}</option>
                                        {hours.map((i, key) => (
                                          <option value={i.value}
                                                  key={key}>
                                              {i.value}
                                          </option>
                                        ))}
                                    </Field>
                                </div>

                                {/* one options for each entry in minutes*/}
                                <div className="chosen-container chosen-container-single">
                                    <Field className="chosen-single"
                                           tabIndex="8"
                                           as="select"
                                           name="scheduleDurationMinutes"
                                           placeholder={t('EVENTS.EVENTS.NEW.SOURCE.PLACEHOLDER.MINUTE')}>
                                        <option value='' hidden>{t('EVENTS.EVENTS.NEW.SOURCE.PLACEHOLDER.MINUTE')}</option>
                                        {minutes.map((i, key) => (
                                          <option key={key}
                                                  value={i.value}>
                                              {i.value}
                                          </option>
                                        ))}
                                    </Field>
                                </div>

                            </td>
                        </tr>
                        <tr>
                            <td>{t('EVENTS.EVENTS.NEW.SOURCE.DATE_TIME.END_TIME')} <i className="required">*</i></td>
                            <td>
                                {/* one options for each entry in hours*/}
                                <div className="chosen-container chosen-container-single">
                                    <Field className="chosen-single"
                                           tabIndex="9"
                                           as="select"
                                           name="scheduleEndTimeHour"
                                           placeholder={t('EVENTS.EVENTS.NEW.SOURCE.PLACEHOLDER.HOUR')}>
                                        <option value='' hidden>{t('EVENTS.EVENTS.NEW.SOURCE.PLACEHOLDER.HOUR')}</option>
                                        {hours.map((i, key) => (
                                          <option key={key}
                                                  value={i.value}>
                                              {i.value}
                                          </option>
                                        ))}
                                    </Field>
                                </div>

                                {/* one options for each entry in minutes*/}
                                <div className="chosen-container chosen-container-single">
                                    <Field className="chosen-single"
                                           tabIndex="10"
                                           as="select"
                                           name="scheduleEndTimeMinutes"
                                           placeholder={t('EVENTS.EVENTS.NEW.SOURCE.PLACEHOLDER.MINUTE')}>
                                        <option value='' hidden>{t('EVENTS.EVENTS.NEW.SOURCE.PLACEHOLDER.MINUTE')}</option>
                                        {minutes.map((i, key) => (
                                          <option key={key}
                                                  value={i.value}>
                                              {i.value}
                                          </option>
                                        ))}
                                    </Field>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>{t('EVENTS.EVENTS.NEW.SOURCE.PLACEHOLDER.LOCATION')} <i className="required">*</i></td>
                            {/* one options for each capture agents that has input options */}
                            <td>
                                <div className="chosen-container chosen-container-single">
                                    <select placeholder={t('EVENTS.EVENTS.NEW.SOURCE.PLACEHOLDER.LOCATION')}
                                            tabIndex="11"
                                            className="chosen-single"
                                            onChange={e => {
                                                formik.setFieldValue("location", e.target.value);
                                                formik.setFieldValue("deviceInputs", []);
                                            }}
                                            name="location">
                                        <option value='' hidden>
                                            {t('EVENTS.EVENTS.NEW.SOURCE.PLACEHOLDER.LOCATION')}
                                        </option>
                                        {inputDevices.map((inputDevice, key) => (
                                          <option key={key} value={inputDevice.name}>{inputDevice.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>{t('EVENTS.EVENTS.NEW.SOURCE.PLACEHOLDER.INPUTS')} <i className="required">*</i></td>
                            <td>
                                {/* Render checkbox for each input option of the selected input device*/}
                                {renderInputDeviceOptions()}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// Getting state data out of redux store
const mapStateToProps = state => ({
    inputDevices: getRecordings(state),
    user: getUserInformation(state)
});

// Mapping actions to dispatch
const mapDispatchToProps = dispatch => ({
    loadingInputDevices: () => dispatch(fetchRecordings("inputs")),
    removeNotificationWizardForm: () => dispatch(removeNotificationWizardForm()),
    checkConflicts: values => dispatch(checkConflicts(values))
});


export default connect(mapStateToProps, mapDispatchToProps)(NewSourcePage);
