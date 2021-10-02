import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { ApplicationState } from '../store';
import { AppDispatch } from '..';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<ApplicationState> = useSelector;
