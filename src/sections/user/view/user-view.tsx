import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import React, { useEffect, useState, useCallback } from 'react';

import {
  Box,
  Card,
  Table,
  Button,
  Dialog,
  MenuItem,
  TableBody,
  TextField,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
} from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { TableNoData } from '../table-no-data';
import { UserTableRow } from '../user-table-row';
import { UserTableHead } from '../user-table-head';
import { TableEmptyRows } from '../table-empty-rows';
import { UserTableToolbar } from '../user-table-toolbar';
import { emptyRows, applyFilter, getComparator } from '../utils';

import type { UserProps } from '../user-table-row';

export function UserView() {
  const table = useTable();
  const [filterName, setFilterName] = useState('');
  const [open, setOpen] = useState(false); // State for modal visibility
  const [formData, setFormData] = useState({
    uuid: '',
    name: '',
    grade: '',
  });
  const [users, setUsers] = useState<UserProps[]>([]);
  const [loading, setLoading] = useState(true);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('authToken');
      if (!token) throw new Error('Token not found. Please log in.');

      const response = await fetch('http://localhost:5000/api/admin/users', {
        method: 'GET',
        headers: { Authorization: `Bearer ${Cookies.get('authToken')}` },
      });

      if (!response.ok) throw new Error('Failed to fetch users.');

      const data = await response.json();
      console.log('API Response:', data); // Add this line
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleFormSubmit = async () => {
    try {
      const token = Cookies.get('authToken');
      if (!token) {
        toast.error('Token not found. Please log in.');
        return;
      }

      const response = await fetch('http://localhost:5000/api/admin/register-child', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to register user.');
      }

      const result = await response.json();
      toast.success('New User Added Successfully!');
      setUsers((prevUsers) => [...prevUsers, result]); // Append new user
      setFormData({ uuid: '', name: '', grade: '' }); // Reset form
      handleClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('An error occurred while adding the user.');
    }
  };

  const dataFiltered: UserProps[] = applyFilter({
    inputData: users,
    comparator: getComparator(table.order, table.orderBy as keyof UserProps),
    filterName,
  });

  const notFound = !dataFiltered.length && !!filterName;

  return (
    <DashboardContent>
      <Box display="flex" alignItems="center" mb={5}>
        <Typography variant="h4" flexGrow={1}>
          Users
        </Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleOpen}
        >
          New user
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="300px">
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <UserTableToolbar
            numSelected={table.selected.length}
            filterName={filterName}
            onFilterName={(event: React.ChangeEvent<HTMLInputElement>) => {
              setFilterName(event.target.value);
              table.onResetPage();
            }}
          />

          <Scrollbar>
            <TableContainer sx={{ overflow: 'unset' }}>
              <Table sx={{ minWidth: 800 }}>
                <UserTableHead
                  order={table.order}
                  orderBy={table.orderBy}
                  rowCount={users.length}
                  numSelected={table.selected.length}
                  onSort={(id: string) => table.onSort(id as keyof UserProps)}
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      users.map((user) => user._id)
                    )
                  }
                  headLabel={[
                    { id: 'name', label: 'Name' },
                    { id: 'grade', label: 'Grade' },
                    { id: 'progress', label: 'Progress (%)' },
                    { id: 'actions', label: 'Actions' },
                  ]}
                />
                <TableBody>
                  {dataFiltered
                    .slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                    .map((row) => (
                      <UserTableRow
                        key={row._id}
                        row={row}
                        selected={table.selected.includes(row._id)}
                        onSelectRow={() => table.onSelectRow(row._id)}
                      />
                    ))}

                  <TableEmptyRows
                    height={68}
                    emptyRows={emptyRows(table.page, table.rowsPerPage, users.length)}
                  />

                  {notFound && <TableNoData searchQuery={filterName} />}
                </TableBody>
              </Table>
            </TableContainer>
          </Scrollbar>

          <TablePagination
            component="div"
            page={table.page}
            count={users.length}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            rowsPerPageOptions={[5, 10, 25]}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      )}

      {/* Modal for adding user */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Enter UUID"
              name="uuid"
              value={formData.uuid}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Enter Name"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="grade-label">Select Grade</InputLabel>
              <Select
                labelId="grade-label"
                name="grade"
                value={formData.grade}
                onChange={handleFormChange}
                fullWidth
              >
                <MenuItem value="Grade A">Grade A</MenuItem>
                <MenuItem value="Grade B">Grade B</MenuItem>
                <MenuItem value="Grade C">Grade C</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleFormSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}

function useTable() {
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState<keyof UserProps>('name');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const onSort = useCallback(
    (id: keyof UserProps) => {
      const isAsc = orderBy === id && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(id);
    },
    [order, orderBy]
  );

  const onSelectAllRows = useCallback((checked: boolean, newSelecteds: string[]) => {
    if (checked) {
      setSelected(newSelecteds);
    } else {
      setSelected([]);
    }
  }, []);

  const onSelectRow = useCallback((id: string) => {
    const selectedIndex = selected.indexOf(id);
    const newSelected = [...selected];
    if (selectedIndex === -1) {
      newSelected.push(id);
    } else {
      newSelected.splice(selectedIndex, 1);
    }
    setSelected(newSelected);
  }, [selected]);

  return {
    page,
    order,
    orderBy,
    rowsPerPage,
    selected,
    setPage,
    onSort,
    setRowsPerPage,
    onSelectRow,
    onSelectAllRows,
    onResetPage: () => setPage(0),
    onChangePage: (event: unknown, newPage: number) => setPage(newPage),
    onChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    },
  };
}
